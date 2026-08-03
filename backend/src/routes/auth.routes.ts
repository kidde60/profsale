import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { emailService } from '../utils/emailService';
import logger from '../utils/logger';
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

    // Accept phone as-is (no normalization)
    const userPhone = phone;

    // Check if user already exists
    let checkQuery = 'SELECT id FROM users WHERE phone = ?';
    let checkParams: any[] = [userPhone];
    
    if (email) {
      checkQuery += ' OR email = ?';
      checkParams.push(email);
    }
    
    const [existingUsers] = await pool.execute<any[]>(checkQuery, checkParams);

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
        [userPhone, email, firstName, lastName, passwordHash],
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
        logger.info('Sending welcome email', {
          email,
          businessName,
          userId,
          businessId,
        });
        emailService
          .sendWelcomeEmail(email, firstName, businessName)
          .then(sent => {
            if (sent) {
              logger.info('Welcome email sent', {
                email,
                userId,
                businessId,
              });
            } else {
              logger.error('Welcome email send returned false', {
                email,
                userId,
                businessId,
              });
            }
          })
          .catch(err =>
            logger.error('Failed to send welcome email', {
              email,
              userId,
              businessId,
              error: err instanceof Error ? err.message : String(err),
            }),
          );
      } else {
        logger.info('Skipping welcome email: no email provided', {
          userId,
          businessId,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: userId,
            phone: userPhone,
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
      console.error('Transaction error during registration:', error);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    if ((error as any)?.code === 'ER_DUP_ENTRY') {
      sendErrorResponse(res, 409, 'User with this phone number or email already exists');
      return;
    }
    sendErrorResponse(res, 500, 'Registration failed', getErrorMessage(error), {
      errorCode: (error as any)?.code,
      errorMessage: (error as any)?.message,
    });
  }
});

// DEBUG: Check user in database (remove in production)
router.get('/debug/check-user/:login', async (req: Request, res: Response) => {
  try {
    const { login } = req.params;
    console.log('DEBUG: Checking user:', login);

    const [users] = await pool.execute<any[]>(
      `SELECT u.id, u.phone, u.email, u.first_name, u.last_name, u.password_hash,
              u.is_verified, u.is_active, b.id as business_id, b.business_name, 
              b.is_active as business_active, bu.role, bu.permissions, bu.is_active as bu_is_active
       FROM users u
       LEFT JOIN business_users bu ON u.id = bu.user_id
       LEFT JOIN businesses b ON bu.business_id = b.id
       WHERE (u.phone = ? OR u.email = ?)`,
      [login, login],
    );

    res.json({
      success: true,
      data: {
        found: users.length > 0,
        count: users.length,
        users: users.map((u: { id: any; phone: any; email: any; first_name: any; last_name: any; password_hash: string; is_active: any; business_id: any; bu_is_active: any; role: any; }) => ({
          id: u.id,
          phone: u.phone,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          password_hash: u.password_hash ? `${u.password_hash.substring(0, 20)}...` : null,
          is_active: u.is_active,
          business_id: u.business_id,
          bu_is_active: u.bu_is_active,
          role: u.role,
        })),
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// User Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Login input:', login);
    console.log('Password provided:', !!password);

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
       INNER JOIN business_users bu ON u.id = bu.user_id
       INNER JOIN businesses b ON bu.business_id = b.id
       WHERE (u.phone = ? OR u.email = ?) AND u.is_active = TRUE AND bu.is_active = TRUE`,
      [login, login],
    );

    console.log('User query result count:', users.length);
    if (users.length > 0) {
      console.log('User found:', {
        id: users[0].id,
        phone: users[0].phone,
        email: users[0].email,
        has_password_hash: !!users[0].password_hash,
        role: users[0].role,
        business_id: users[0].business_id,
        is_active: users[0].is_active,
      });
    }

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
         GROUP BY s.id, s.email, s.phone, s.name, s.password_hash, s.is_active,
                  s.business_id, s.role, b.business_name, b.is_active`,
        [login, login],
      );

      if (staff.length === 0) {
        sendErrorResponse(res, 404, 'Account not found');
        return;
      }

      const staffMember = staff[0];

      // Verify password
      const passwordValid = await bcrypt.compare(password, staffMember.password_hash);
      if (!passwordValid) {
        sendErrorResponse(res, 401, 'Incorrect password');
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

    console.log('Attempting password verification...');
    console.log('Password hash exists:', !!user.password_hash);
    console.log('Password hash length:', user.password_hash?.length || 0);

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    console.log('Password verification result:', passwordValid);
    
    if (!passwordValid) {
      console.log('Password mismatch for user:', user.id);
      sendErrorResponse(res, 401, 'Incorrect password');
      return;
    }

    console.log('Password verified successfully for user:', user.id);

    // Check if business is active
    if (user.business_id && !user.business_active) {
      sendErrorResponse(res, 403, 'Business account is inactive');
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.business_id, 'user');

    // Update last login
    await pool.execute('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Parse permissions - owners always have all permissions
    let permissions = user.permissions ? JSON.parse(user.permissions) : {};
    if ((user.role || 'owner') === 'owner') {
      permissions = {
        canViewReports: true,
        canManageInventory: true,
        canManageEmployees: true,
        canManageSettings: true,
      };
    }

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
          permissions,
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
      logger.info('Sending password reset email', {
        email: user.email,
        userId: user.id,
      });
      emailService
        .sendPasswordResetEmail(user.email, user.first_name, resetCode)
        .then(sent => {
          if (sent) {
            logger.info('Password reset email sent', {
              email: user.email,
              userId: user.id,
            });
          } else {
            logger.error('Password reset email send returned false', {
              email: user.email,
              userId: user.id,
            });
          }
        })
        .catch(err =>
          logger.error('Failed to send password reset email', {
            email: user.email,
            userId: user.id,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
    }

    // Log for development
    logger.info('Password reset code generated', {
      contact,
      expiresAt: expiresAt.toISOString(),
    });

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
