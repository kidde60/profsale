import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import {
  requireOwner,
  requireOwnerOrManageStaff,
} from '../middleware/permissions';
import nodemailer from 'nodemailer';

const router = Router();

// Email configuration (you'll need to set up SMTP credentials)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate random password
function generatePassword(): string {
  const length = 10;
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Send password email
async function sendPasswordEmail(
  email: string,
  password: string,
  name: string,
  businessName: string,
) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Your ProfSale Account Credentials',
    html: `
      <h2>Welcome to ${businessName}!</h2>
      <p>Hello ${name},</p>
      <p>Your account has been created successfully. Here are your login credentials:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Email/Phone:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      <p>Please keep this information secure and change your password after your first login.</p>
      <p>You can log in to the ProfSale mobile app using these credentials.</p>
      <br>
      <p>Best regards,<br>${businessName}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password email sent to:', email);
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error - staff is created even if email fails
  }
}

// GET /api/staff - List all staff members
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;

    const [staff] = await pool.execute<any[]>(
      `SELECT 
        s.id, s.name, s.email, s.phone_number, s.role, s.is_active, s.created_at,
        GROUP_CONCAT(sp.permission_name) as permissions
      FROM staff_members s
      LEFT JOIN staff_permissions sp ON s.id = sp.staff_id AND sp.is_granted = TRUE
      WHERE s.business_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC`,
      [businessId],
    );

    const formattedStaff = staff.map((member: any) => ({
      ...member,
      permissions: member.permissions ? member.permissions.split(',') : [],
    }));

    res.json({
      success: true,
      data: formattedStaff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff members',
    });
  }
});

// GET /api/staff/:id - Get single staff member details
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const staffId = parseInt(req.params.id as string);

    const [staff] = await pool.execute<any[]>(
      `SELECT 
        s.id, s.name, s.email, s.phone_number, s.role, s.is_active, s.created_at,
        GROUP_CONCAT(sp.permission_name) as permissions
      FROM staff_members s
      LEFT JOIN staff_permissions sp ON s.id = sp.staff_id AND sp.is_granted = TRUE
      WHERE s.id = ? AND s.business_id = ?
      GROUP BY s.id`,
      [staffId, businessId],
    );

    if (!staff.length) {
      res
        .status(404)
        .json({ success: false, message: 'Staff member not found' });
      return;
    }

    const member = {
      ...staff[0],
      permissions: staff[0].permissions ? staff[0].permissions.split(',') : [],
    };

    res.json({ success: true, data: member });
  } catch (error) {
    console.error('Get staff member error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch staff member' });
  }
});

// POST /api/staff - Create new staff member (owner or manage_staff permission)
router.post(
  '/',
  authenticateToken,
  requireOwnerOrManageStaff,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const createdBy = (req as any).user.id;
      const { name, email, phone_number, role, permissions, password } =
        req.body;

      // Validation
      if (!name || !email) {
        res.status(400).json({
          success: false,
          message: 'Name and email are required',
        });
        return;
      }

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'Password is required',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
        return;
      }

      // Check if email already exists for this business
      const [existing] = await pool.execute<any[]>(
        'SELECT id FROM staff_members WHERE business_id = ? AND email = ?',
        [businessId, email],
      );

      if (existing.length > 0) {
        res.status(400).json({
          success: false,
          message: 'A staff member with this email already exists',
        });
        return;
      }

      // Use provided password
      const plainPassword = password;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // Get business name for email
      const [business] = await pool.execute<any[]>(
        'SELECT business_name FROM businesses WHERE id = ?',
        [businessId],
      );
      const businessName = business[0]?.business_name || 'Your Business';

      // Create staff member
      const [result] = await pool.execute<any>(
        `INSERT INTO staff_members 
        (business_id, name, email, phone_number, password_hash, role, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          businessId,
          name,
          email,
          phone_number || null,
          hashedPassword,
          role || 'cashier',
          createdBy,
        ],
      );

      const staffId = result.insertId;

      // Add permissions if provided
      if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        const permissionValues = permissions.map((perm: string) => [
          staffId,
          perm,
          true,
        ]);
        await pool.query(
          'INSERT INTO staff_permissions (staff_id, permission_name, is_granted) VALUES ?',
          [permissionValues],
        );
      }

      // Send password email
      await sendPasswordEmail(email, plainPassword, name, businessName);

      // Log activity (staff_id is NULL for business owner actions)
      await pool.execute(
        `INSERT INTO activity_logs (business_id, staff_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)`,
        [
          businessId,
          null, // Business owner is not in staff_members table
          'staff_created',
          'staff',
          staffId,
          JSON.stringify({ staff_name: name, staff_email: email, role }),
        ],
      );

      res.status(201).json({
        success: true,
        message: 'Staff member created successfully. Password sent to email.',
        data: {
          id: staffId,
          name,
          email,
          phone_number,
          role,
          permissions,
        },
      });
    } catch (error) {
      console.error('Create staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create staff member',
      });
    }
  },
);

// PUT /api/staff/:id - Update staff member (owner or manage_staff permission)
router.put(
  '/:id',
  authenticateToken,
  requireOwnerOrManageStaff,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const staffId = parseInt(req.params.id as string);
      const { name, email, phone_number, role, permissions, is_active } =
        req.body;

      // Check if staff exists
      const [existing] = await pool.execute<any[]>(
        'SELECT id FROM staff_members WHERE id = ? AND business_id = ?',
        [staffId, businessId],
      );

      if (!existing.length) {
        res
          .status(404)
          .json({ success: false, message: 'Staff member not found' });
        return;
      }

      // Update staff member
      await pool.execute(
        `UPDATE staff_members 
      SET name = ?, email = ?, phone_number = ?, role = ?, is_active = ?
      WHERE id = ? AND business_id = ?`,
        [
          name,
          email,
          phone_number || null,
          role,
          is_active !== undefined ? is_active : true,
          staffId,
          businessId,
        ],
      );

      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        // Delete existing permissions
        await pool.execute('DELETE FROM staff_permissions WHERE staff_id = ?', [
          staffId,
        ]);

        // Add new permissions
        if (permissions.length > 0) {
          const permissionValues = permissions.map((perm: string) => [
            staffId,
            perm,
            true,
          ]);
          await pool.query(
            'INSERT INTO staff_permissions (staff_id, permission_name, is_granted) VALUES ?',
            [permissionValues],
          );
        }
      }

      res.json({
        success: true,
        message: 'Staff member updated successfully',
      });
    } catch (error) {
      console.error('Update staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update staff member',
      });
    }
  },
);

// DELETE /api/staff/:id - Deactivate staff member (owner or manage_staff permission)
router.delete(
  '/:id',
  authenticateToken,
  requireOwnerOrManageStaff,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const staffId = parseInt(req.params.id as string);
      const userId = (req as any).user.id;

      // Prevent owner from deleting themselves
      if (staffId === userId) {
        res.status(400).json({
          success: false,
          message: 'You cannot delete your own account',
        });
        return;
      }

      // Deactivate instead of delete
      const [result] = await pool.execute<any>(
        'UPDATE staff_members SET is_active = FALSE WHERE id = ? AND business_id = ?',
        [staffId, businessId],
      );

      if (result.affectedRows === 0) {
        res
          .status(404)
          .json({ success: false, message: 'Staff member not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Staff member deactivated successfully',
      });
    } catch (error) {
      console.error('Delete staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate staff member',
      });
    }
  },
);

// PUT /api/staff/:id/activate - Activate staff member (owner or manage_staff permission)
router.put(
  '/:id/activate',
  authenticateToken,
  requireOwnerOrManageStaff,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const staffId = parseInt(req.params.id as string);

      // Activate the staff member
      const [result] = await pool.execute<any>(
        'UPDATE staff_members SET is_active = TRUE WHERE id = ? AND business_id = ?',
        [staffId, businessId],
      );

      if (result.affectedRows === 0) {
        res
          .status(404)
          .json({ success: false, message: 'Staff member not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Staff member activated successfully',
      });
    } catch (error) {
      console.error('Activate staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate staff member',
      });
    }
  },
);

// GET /api/staff/:id/activity - Get staff activity logs
router.get(
  '/:id/activity',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const staffId = parseInt(req.params.id as string);
      const limit = parseInt(req.query.limit as string) || 50;

      const [logs] = await pool.execute<any[]>(
        `SELECT 
        al.id, al.action, al.entity_type, al.entity_id, al.details, al.created_at,
        s.name as staff_name
      FROM activity_logs al
      JOIN staff_members s ON al.staff_id = s.id
      WHERE al.business_id = ? AND al.staff_id = ?
      ORDER BY al.created_at DESC
      LIMIT ?`,
        [businessId, staffId, limit],
      );

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity logs',
      });
    }
  },
);

// GET /api/staff/permissions/available - List all available permissions
router.get(
  '/permissions/available',
  authenticateToken,
  (req: Request, res: Response) => {
    const permissions = [
      // POS & Sales
      { name: 'create_sale', label: 'Create Sales', category: 'Sales' },
      { name: 'view_sales', label: 'View Sales', category: 'Sales' },
      { name: 'edit_sale', label: 'Edit Sales', category: 'Sales' },
      { name: 'delete_sale', label: 'Delete Sales', category: 'Sales' },
      { name: 'refund_sale', label: 'Process Refunds', category: 'Sales' },

      // Products & Inventory
      { name: 'create_product', label: 'Add Products', category: 'Products' },
      { name: 'view_products', label: 'View Products', category: 'Products' },
      { name: 'edit_product', label: 'Edit Products', category: 'Products' },
      {
        name: 'delete_product',
        label: 'Delete Products',
        category: 'Products',
      },
      { name: 'adjust_stock', label: 'Adjust Stock', category: 'Products' },

      // Customers
      {
        name: 'create_customer',
        label: 'Add Customers',
        category: 'Customers',
      },
      {
        name: 'view_customers',
        label: 'View Customers',
        category: 'Customers',
      },
      { name: 'edit_customer', label: 'Edit Customers', category: 'Customers' },
      {
        name: 'delete_customer',
        label: 'Delete Customers',
        category: 'Customers',
      },

      // Expenses
      { name: 'create_expense', label: 'Add Expenses', category: 'Expenses' },
      { name: 'view_expenses', label: 'View Expenses', category: 'Expenses' },
      { name: 'edit_expense', label: 'Edit Expenses', category: 'Expenses' },
      {
        name: 'delete_expense',
        label: 'Delete Expenses',
        category: 'Expenses',
      },

      // Reports & Analytics
      { name: 'view_reports', label: 'View Reports', category: 'Reports' },
      { name: 'view_dashboard', label: 'View Dashboard', category: 'Reports' },
      { name: 'export_data', label: 'Export Data', category: 'Reports' },

      // Staff & Settings
      { name: 'manage_staff', label: 'Manage Staff', category: 'Settings' },
      {
        name: 'manage_subscription',
        label: 'Manage Subscription',
        category: 'Settings',
      },
      { name: 'view_settings', label: 'View Settings', category: 'Settings' },
      {
        name: 'manage_business',
        label: 'Manage Business',
        category: 'Settings',
      },
    ];

    res.json({
      success: true,
      data: permissions,
    });
  },
);

export default router;
