// routes/auth.routes.ts - Authentication endpoints
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { emailService } from '../utils/emailService';

const router = Router();

// Interface for user data
interface User {
  id: number;
  phone: string;
  email?: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  is_verified: boolean;
  is_active: boolean;
}

// Generate JWT token
const generateToken = (
  userId: number,
  businessId?: number,
  userType: 'user' | 'staff' = 'user',
): string => {
  return jwt.sign(
    {
      userId,
      businessId,
      userType,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  );
};

// User Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      phone,
      email,
      firstName,
      lastName,
      businessName,
      businessType = 'retail',
      password,
    } = req.body;

    // Basic validation
    if (!phone || !firstName || !lastName || !businessName || !password) {
      res.status(400).json({
        success: false,
        message:
          'Missing required fields: phone, firstName, lastName, businessName, password',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Normalize phone number (simple version)
    const normalizedPhone = phone.startsWith('+')
      ? phone
      : `+256${phone.replace(/^0/, '')}`;

    // Check if user already exists
    const [existingUsers] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE phone = ? OR email = ?',
      [normalizedPhone, email],
    );

    if (existingUsers.length > 0) {
      res.status(409).json({
        success: false,
        message: 'User with this phone number or email already exists',
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      const [userResult] = await connection.execute<any>(
        `INSERT INTO users 
        (phone, email, first_name, last_name, password_hash, is_verified, is_active) 
        VALUES (?, ?, ?, ?, ?, FALSE, TRUE)`,
        [normalizedPhone, email, firstName, lastName, passwordHash],
      );

      const userId = userResult.insertId;

      // Create business
      const [businessResult] = await connection.execute<any>(
        `INSERT INTO businesses 
        (owner_id, business_name, business_type, currency, timezone, is_active) 
        VALUES (?, ?, ?, 'UGX', 'Africa/Kampala', TRUE)`,
        [userId, businessName, businessType],
      );

      const businessId = businessResult.insertId;

      // Create business-employee relationship (owner)
      await connection.execute(
        `INSERT INTO business_employees 
        (user_id, business_id, role, permissions, is_active) 
        VALUES (?, ?, 'owner', ?, TRUE)`,
        [
          userId,
          businessId,
          JSON.stringify({
            canViewReports: true,
            canManageInventory: true,
            canManageEmployees: true,
            canManageSettings: true,
          }),
        ],
      );

      // Create 60-day trial subscription
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 60);

      // Get trial plan ID (assuming it's the first plan with trial_days = 60)
      const [trialPlans] = await connection.execute<any[]>(
        'SELECT id FROM subscription_plans WHERE trial_days = 60 AND is_active = TRUE LIMIT 1',
      );

      if (trialPlans.length > 0) {
        await connection.execute(
          `INSERT INTO business_subscriptions 
          (business_id, plan_id, status, trial_ends_at, current_period_start, current_period_end, auto_renew) 
          VALUES (?, ?, 'trial', ?, NOW(), ?, FALSE)`,
          [businessId, trialPlans[0].id, trialEndDate, trialEndDate],
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
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// User Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    // Basic validation
    if (!login || !password) {
      res.status(400).json({
        success: false,
        message: 'Phone/email and password are required',
      });
      return;
    }

    // First, try to find as a regular user (business owner)
    const [users] = await pool.execute<any[]>(
      `SELECT 
        u.id, u.phone, u.email, u.first_name, u.last_name, u.password_hash,
        u.is_verified, u.is_active,
        b.id as business_id, b.business_name, b.is_active as business_active,
        be.role, be.permissions, be.is_active as employee_active,
        'user' as user_type
      FROM users u
      LEFT JOIN business_employees be ON u.id = be.user_id
      LEFT JOIN businesses b ON be.business_id = b.id
      WHERE (u.phone = ? OR u.email = ?) AND u.is_active = TRUE`,
      [login, login],
    );

    // If not found as user, try to find as staff member
    if (users.length === 0) {
      const [staff] = await pool.execute<any[]>(
        `SELECT 
          s.id, s.email, s.phone_number as phone, s.name, s.password_hash,
          s.is_active, s.business_id, s.role,
          b.business_name, b.is_active as business_active,
          GROUP_CONCAT(sp.permission_name) as permissions,
          'staff' as user_type
        FROM staff_members s
        JOIN businesses b ON s.business_id = b.id
        LEFT JOIN staff_permissions sp ON s.id = sp.staff_id AND sp.is_granted = TRUE
        WHERE (s.email = ? OR s.phone_number = ?) AND s.is_active = TRUE
        GROUP BY s.id`,
        [login, login],
      );

      if (staff.length === 0) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      const staffMember = staff[0];

      // Verify password for staff
      const passwordValid = await bcrypt.compare(
        password,
        staffMember.password_hash,
      );
      if (!passwordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Check if business is active
      if (!staffMember.business_active) {
        res.status(403).json({
          success: false,
          message: 'Business account is inactive',
        });
        return;
      }

      // Generate JWT token for staff
      const token = generateToken(
        staffMember.id,
        staffMember.business_id,
        'staff',
      );

      // Parse staff name (assuming format: "First Last")
      const nameParts = staffMember.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Parse permissions - map individual permissions to grouped categories
      const permissionsArray = staffMember.permissions
        ? staffMember.permissions.split(',')
        : [];
      const permissionsObj = {
        canViewReports: permissionsArray.some((p: string) =>
          [
            'view_reports',
            'view_dashboard',
            'view_sales',
            'view_expenses',
            'view_customers',
          ].includes(p),
        ),
        canManageInventory: permissionsArray.some((p: string) =>
          [
            'create_product',
            'edit_product',
            'delete_product',
            'view_products',
            'adjust_stock',
            'create_sale',
            'edit_sale',
            'delete_sale',
            'refund_sale',
            'create_customer',
            'edit_customer',
            'delete_customer',
            'create_expense',
            'edit_expense',
            'delete_expense',
          ].includes(p),
        ),
        canManageEmployees: permissionsArray.includes('manage_staff'),
        canManageSettings: permissionsArray.some((p: string) =>
          ['manage_subscription', 'view_settings', 'manage_business'].includes(
            p,
          ),
        ),
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
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check if business is active (if user has business)
    if (user.business_id && !user.business_active) {
      res.status(403).json({
        success: false,
        message: 'Business account is inactive',
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user.id, user.business_id, 'user');

    // Update last login (optional)
    await pool.execute(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id],
    );

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
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Get User Profile (requires authentication)
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // Simple token extraction
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get user details
    const [users] = await pool.execute<any[]>(
      `SELECT 
        u.id, u.phone, u.email, u.first_name, u.last_name,
        u.is_verified, u.is_active, u.created_at,
        b.id as business_id, b.business_name, b.business_type,
        be.role, be.permissions, be.joined_at
      FROM users u
      LEFT JOIN business_employees be ON u.id = be.user_id
      LEFT JOIN businesses b ON be.business_id = b.id
      WHERE u.id = ?`,
      [userId],
    );

    if (users.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
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

    if (
      (error as any).name === 'JsonWebTokenError' ||
      (error as any).name === 'TokenExpiredError'
    ) {
      res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Forgot Password - Request reset code
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { contact } = req.body; // can be email or phone

    if (!contact) {
      res.status(400).json({
        success: false,
        message: 'Email or phone number is required',
      });
      return;
    }

    // Find user by email or phone
    const [users] = await pool.execute<any[]>(
      'SELECT id, email, phone, first_name FROM users WHERE email = ? OR phone = ? AND is_active = TRUE',
      [contact, contact],
    );

    if (users.length === 0) {
      // Don't reveal if user exists for security
      res.json({
        success: true,
        message: 'If an account exists, a reset code has been sent',
      });
      return;
    }

    const user = users[0];

    // Generate 6-digit reset code (token)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset code in database
    await pool.execute(
      `INSERT INTO password_resets (user_id, reset_code, expires_at, is_used) 
       VALUES (?, ?, ?, FALSE)
       ON DUPLICATE KEY UPDATE reset_code = ?, expires_at = ?, is_used = FALSE`,
      [user.id, resetCode, expiresAt, resetCode, expiresAt],
    );

    // Send password reset email if user has email
    if (user.email) {
      emailService
        .sendPasswordResetEmail(user.email, user.first_name, resetCode)
        .catch(err =>
          console.error('Failed to send password reset email:', err),
        );
    }

    // Log reset code for development/SMS fallback
    console.log(
      `Reset code for ${contact}: ${resetCode} (expires at ${expiresAt})`,
    );

    res.json({
      success: true,
      message: user.email
        ? 'Reset code has been sent to your email'
        : 'Reset code has been sent to your phone',
      // Remove this in production - only for development
      ...(process.env.NODE_ENV === 'development' && { resetCode }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Reset Password - Verify code and update password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { contact, resetCode, newPassword } = req.body;

    if (!contact || !resetCode || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Contact, reset code, and new password are required',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Find user
    const [users] = await pool.execute<any[]>(
      'SELECT id FROM users WHERE email = ? OR phone = ? AND is_active = TRUE',
      [contact, contact],
    );

    if (users.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const userId = users[0].id;

    // Verify reset code
    const [resets] = await pool.execute<any[]>(
      `SELECT id, expires_at, is_used 
       FROM password_resets 
       WHERE user_id = ? AND reset_code = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId, resetCode],
    );

    if (resets.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid reset code',
      });
      return;
    }

    const reset = resets[0];

    if (reset.is_used) {
      res.status(400).json({
        success: false,
        message: 'Reset code has already been used',
      });
      return;
    }

    if (new Date() > new Date(reset.expires_at)) {
      res.status(400).json({
        success: false,
        message: 'Reset code has expired',
      });
      return;
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [
      passwordHash,
      userId,
    ]);

    // Mark reset code as used
    await pool.execute(
      'UPDATE password_resets SET is_used = TRUE WHERE id = ?',
      [reset.id],
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
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
