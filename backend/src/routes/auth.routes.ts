import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { emailService } from '../utils/emailService';
import { sendErrorResponse, getErrorMessage } from '../utils/errorResponse';

const router = Router();

// Constants
const BCRYPT_SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const TRIAL_DAYS = 60;
const DEFAULT_PHONE_PREFIX = '+256';
const DEFAULT_CURRENCY = 'UGX';
const DEFAULT_TIMEZONE = 'Africa/Kampala';
const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Types
interface TokenPayload {
  userId: number;
  businessId?: number;
  userType: 'user' | 'staff';
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Utility Functions
const generateToken = (userId: number, businessId?: number, userType: 'user' | 'staff' = 'user'): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    { userId, businessId, userType } as TokenPayload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as any,
  );
};

const normalizePhoneNumber = (phone: string): string => {
  if (phone.startsWith('+')) return phone;
  return `${DEFAULT_PHONE_PREFIX}${phone.replace(/^0/, '')}`;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` };
  }
  return { valid: true };
};

// User Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, email, firstName, lastName, businessName, businessType = 'retail', password } = req.body;

    // Validate required fields
    if (!phone || !firstName || !lastName || !businessName || !password) {
      sendErrorResponse(res, 400, 'Missing required fields: phone, firstName, lastName, businessName, password');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      sendErrorResponse(res, 400, passwordValidation.message!);
      return;
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      sendErrorResponse(res, 400, 'Invalid email format');
      return;
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Check if user already exists
    const [existingUsers] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE phone = ? OR email = ?',
      [normalizedPhone, email],
    );

    if (existingUsers.length > 0) {
      sendErrorResponse(res, 409, 'User with this phone number or email already exists');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      const [userResult] = await connection.execute<any>(
        'INSERT INTO users (phone, email, first_name, last_name, password_hash, is_verified, is_active) VALUES (?, ?, ?, ?, ?, FALSE, TRUE)',
        [normalizedPhone, email, firstName, lastName, passwordHash],
      );

      const userId = userResult.insertId;

      // Create business
      const [businessResult] = await connection.execute<any>(
        'INSERT INTO businesses (owner_id, business_name, business_type, currency, timezone, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
        [userId, businessName, businessType, DEFAULT_CURRENCY, DEFAULT_TIMEZONE],
      );

      const businessId = businessResult.insertId;

      // Create business-employee relationship (owner)
      const ownerPermissions = JSON.stringify({
        canViewReports: true,
        canManageInventory: true,
        canManageEmployees: true,
        canManageSettings: true,
      });

      await connection.execute(
        'INSERT INTO business_users (user_id, business_id, role, permissions, joined_at) VALUES (?, ?, ?, ?, NOW())',
        [userId, businessId, 'owner', ownerPermissions],
      );

      // Create trial subscription
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

      const [trialPlans] = await connection.execute<any[]>(
        `SELECT id FROM subscription_plans WHERE trial_days = ? AND is_active = TRUE LIMIT 1`,
        [TRIAL_DAYS],
      );

      if (trialPlans.length > 0) {
        await connection.execute(
          'INSERT INTO business_subscriptions (business_id, plan_id, status, trial_ends_at, current_period_start, current_period_end, auto_renew) VALUES (?, ?, ?, ?, NOW(), ?, FALSE)',
          [businessId, trialPlans[0].id, 'trial', trialEndDate, trialEndDate],
        );
      }

      await connection.commit();

      // Generate JWT token
      const token = generateToken(userId, businessId);

      // Send welcome email (non-blocking)
      if (email) {
        emailService
          .sendWelcomeEmail(email, firstName, businessName)
          .catch(err => console.error('Failed to send welcome email:', err));
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: userId,
            phone: normalizedPhone,
            email,
            firstName,
            lastName,
            businessId,
            businessName,
          },
          token,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    sendErrorResponse(res, 500, 'Registration failed', getErrorMessage(error));
  }
});

// User Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    // Validate input
    if (!login || !password) {
      sendErrorResponse(res, 400, 'Phone/email and password are required');
      return;
    }

    // Try to find as a regular user (business owner)
    const [users] = await pool.execute<any[]>(
      `SELECT u.id, u.phone, u.email, u.first_name, u.last_name, u.password_hash,
              u.is_verified, u.is_active, b.id as business_id, b.business_name, 
              b.is_active as business_active, bu.role, bu.permissions
       FROM users u
       LEFT JOIN business_users bu ON u.id = bu.user_id
       LEFT JOIN businesses b ON bu.business_id = b.id
       WHERE (u.phone = ? OR u.email = ?) AND u.is_active = TRUE`,
      [login, login],
    );

    // Try to find as staff member if not found as user
    if (users.length === 0) {
      const [staff] = await pool.execute<any[]>(
        `SELECT s.id, s.email, s.phone, s.name, s.password_hash, s.is_active,
                s.business_id, s.role, b.business_name, b.is_active as business_active,
                GROUP_CONCAT(sp.permission_name) as permissions
         FROM staff_members s
         JOIN businesses b ON s.business_id = b.id
         LEFT JOIN staff_permissions sp ON s.id = sp.staff_id AND sp.is_granted = TRUE
         WHERE (s.email = ? OR s.phone = ?) AND s.is_active = TRUE
         GROUP BY s.id`,
        [login, login],
      );

      if (staff.length === 0) {
        sendErrorResponse(res, 401, 'Invalid credentials');
        return;
      }

      const staffMember = staff[0];

      // Verify password
      const passwordValid = await bcrypt.compare(password, staffMember.password_hash);
      if (!passwordValid) {
        sendErrorResponse(res, 401, 'Invalid credentials');
        return;
      }

      // Check if business is active
      if (!staffMember.business_active) {
        sendErrorResponse(res, 403, 'Business account is inactive');
        return;
      }

      // Generate token
      const token = generateToken(staffMember.id, staffMember.business_id, 'staff');

      // Parse name
      const nameParts = staffMember.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Map permissions
      const permissionsArray = staffMember.permissions ? staffMember.permissions.split(',') : [];
      const reportPermissions = ['view_reports', 'view_dashboard', 'view_sales', 'view_expenses', 'view_customers'];
      const inventoryPermissions = ['create_product', 'edit_product', 'delete_product', 'view_products', 'adjust_stock', 'create_sale', 'edit_sale', 'delete_sale', 'refund_sale', 'create_customer', 'edit_customer', 'delete_customer', 'create_expense', 'edit_expense', 'delete_expense'];
      const settingsPermissions = ['manage_subscription', 'view_settings', 'manage_business'];

      const permissionsObj = {
        canViewReports: permissionsArray.some((p: string) => reportPermissions.includes(p)),
        canManageInventory: permissionsArray.some((p: string) => inventoryPermissions.includes(p)),
        canManageEmployees: permissionsArray.includes('manage_staff'),
        canManageSettings: permissionsArray.some((p: string) => settingsPermissions.includes(p)),
      };

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: staffMember.id,
            phone: staffMember.phone,
            email: staffMember.email,
            firstName,
            lastName,
            businessId: staffMember.business_id,
            businessName: staffMember.business_name,
            role: staffMember.role,
            permissions: permissionsObj,
            isVerified: true,
            userType: 'staff',
          },
          token,
        },
      });
      return;
    }

    // Handle regular user login
    const user = users[0];

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      sendErrorResponse(res, 401, 'Invalid credentials');
      return;
    }

    // Check if business is active
    if (user.business_id && !user.business_active) {
      sendErrorResponse(res, 403, 'Business account is inactive');
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.business_id, 'user');

    // Update last login
    await pool.execute('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          businessId: user.business_id,
          businessName: user.business_name,
          role: user.role || 'owner',
          permissions: user.permissions ? JSON.parse(user.permissions) : {},
          isVerified: user.is_verified,
          userType: 'user',
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    sendErrorResponse(res, 500, 'Login failed', getErrorMessage(error));
  }
});

// Get User Profile (requires authentication)
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // Extract token
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      sendErrorResponse(res, 401, 'Access token required');
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const userId = decoded.userId;

    // Get user details
    const [users] = await pool.execute<any[]>(
      `SELECT u.id, u.phone, u.email, u.first_name, u.last_name, u.is_verified, u.is_active, u.created_at,
              b.id as business_id, b.business_name, b.business_type, bu.role, bu.permissions, bu.joined_at
       FROM users u
       LEFT JOIN business_users bu ON u.id = bu.user_id
       LEFT JOIN businesses b ON bu.business_id = b.id
       WHERE u.id = ?`,
      [userId],
    );

    if (users.length === 0) {
      sendErrorResponse(res, 404, 'User not found');
      return;
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.is_verified,
          isActive: user.is_active,
          createdAt: user.created_at,
          business: user.business_id
            ? {
                id: user.business_id,
                name: user.business_name,
                type: user.business_type,
              }
            : null,
          role: user.role,
          permissions: user.permissions ? JSON.parse(user.permissions) : {},
          joinedAt: user.joined_at,
        },
      },
    });
  } catch (error) {
    console.error('Profile error:', error);

    if ((error as any).name === 'JsonWebTokenError' || (error as any).name === 'TokenExpiredError') {
      sendErrorResponse(res, 403, 'Invalid or expired token');
      return;
    }

    sendErrorResponse(res, 500, 'Failed to get profile', getErrorMessage(error));
  }
});

// Forgot Password - Request reset code
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { contact } = req.body;

    if (!contact) {
      sendErrorResponse(res, 400, 'Email or phone number is required');
      return;
    }

    // Find user
    const [users] = await pool.execute<any[]>(
      'SELECT id, email, phone, first_name FROM users WHERE (email = ? OR phone = ?) AND is_active = TRUE',
      [contact, contact],
    );

    if (users.length === 0) {
      // Return 404 if user not found - frontend will handle this
      sendErrorResponse(res, 404, 'Email or phone number not found');
      return;
    }

    const user = users[0];

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    // Store reset code
    await pool.execute(
      'INSERT INTO password_resets (user_id, reset_code, expires_at, is_used) VALUES (?, ?, ?, FALSE) ON DUPLICATE KEY UPDATE reset_code = ?, expires_at = ?, is_used = FALSE',
      [user.id, resetCode, expiresAt, resetCode, expiresAt],
    );

    // Send email
    if (user.email) {
      emailService
        .sendPasswordResetEmail(user.email, user.first_name, resetCode)
        .catch(err => console.error('Failed to send password reset email:', err));
    }

    // Log for development
    console.log(`Reset code for ${contact}: ${resetCode} (expires at ${expiresAt})`);

    res.json({
      success: true,
      message: user.email ? 'Reset code has been sent to your email' : 'Reset code has been sent to your phone',
      ...(process.env.NODE_ENV === 'development' && { resetCode }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    sendErrorResponse(res, 500, 'Failed to process request', getErrorMessage(error));
  }
});

// Reset Password - Verify code and update password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { contact, resetCode, newPassword } = req.body;

    if (!contact || !resetCode || !newPassword) {
      sendErrorResponse(res, 400, 'Contact, reset code, and new password are required');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      sendErrorResponse(res, 400, passwordValidation.message!);
      return;
    }

    // Find user
    const [users] = await pool.execute<any[]>(
      'SELECT id, email, first_name FROM users WHERE (email = ? OR phone = ?) AND is_active = TRUE',
      [contact, contact],
    );

    if (users.length === 0) {
      sendErrorResponse(res, 404, 'User not found');
      return;
    }

    const userId = users[0].id;
    const userEmail = users[0].email;
    const firstName = users[0].first_name;

    // Verify reset code
    const [resets] = await pool.execute<any[]>(
      'SELECT id, expires_at, is_used FROM password_resets WHERE user_id = ? AND reset_code = ? ORDER BY created_at DESC LIMIT 1',
      [userId, resetCode],
    );

    if (resets.length === 0) {
      sendErrorResponse(res, 400, 'Invalid reset code');
      return;
    }

    const reset = resets[0];

    if (reset.is_used) {
      sendErrorResponse(res, 400, 'Reset code has already been used');
      return;
    }

    if (new Date() > new Date(reset.expires_at)) {
      sendErrorResponse(res, 400, 'Reset code has expired');
      return;
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update password
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);

    // Mark reset code as used
    await pool.execute('UPDATE password_resets SET is_used = TRUE WHERE id = ?', [reset.id]);

    // Send password reset confirmation email
    if (userEmail) {
      await emailService.sendPasswordResetConfirmation(userEmail, firstName);
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    sendErrorResponse(res, 500, 'Failed to reset password', getErrorMessage(error));
  }
});

// Test endpoint for auth
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Auth routes are working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
