// routes/business.routes.ts - Business settings management endpoints
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Simple authentication middleware
const authenticateToken = (req: Request, res: Response, next: Function) => {
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

  // Mock user for now
  (req as any).user = { id: 3, businessId: 2, role: 'owner' };
  next();
};

// Require owner/manager access for settings
const requireManagementAccess = (
  req: Request,
  res: Response,
  next: Function,
) => {
  const userRole = (req as any).user.role;

  if (!['owner', 'manager'].includes(userRole)) {
    res.status(403).json({
      success: false,
      message: 'Management access required',
    });
    return;
  }

  next();
};

// Get business profile
router.get(
  '/profile',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      console.log('uesesr', (req as any).user);

      const [businesses] = await pool.execute<any[]>(
        `SELECT 
        b.*,
        u.first_name as owner_first_name, u.last_name as owner_last_name,
        u.email as owner_email, u.phone as owner_phone
      FROM businesses b
      JOIN users u ON b.owner_id = u.id
      WHERE b.id = ?`,
        [businessId],
      );

      if (businesses.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Business not found',
        });
        return;
      }

      const business = businesses[0];

      // Parse JSON fields safely
      const profileData = {
        ...business,
        business_hours: business.business_hours
          ? JSON.parse(business.business_hours)
          : null,
        notification_preferences: business.notification_preferences
          ? JSON.parse(business.notification_preferences)
          : null,
        payment_methods: business.payment_methods
          ? JSON.parse(business.payment_methods)
          : [],
        pricing_settings: business.pricing_settings
          ? JSON.parse(business.pricing_settings)
          : null,
        inventory_settings: business.inventory_settings
          ? JSON.parse(business.inventory_settings)
          : null,
      };

      res.json({
        success: true,
        data: {
          business: profileData,
        },
      });
    } catch (error) {
      console.error('Get business profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch business profile',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Update business profile
router.put(
  '/profile',
  authenticateToken,
  requirePermission('manage_business'),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;

      const {
        businessName,
        businessType,
        description,
        phone,
        email,
        address,
        taxNumber,
        taxRate,
        currency,
        timezone,
      } = req.body;

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      if (businessName) {
        updates.push('business_name = ?');
        values.push(businessName);
      }

      if (businessType) {
        updates.push('business_type = ?');
        values.push(businessType);
      }

      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }

      if (phone) {
        updates.push('phone = ?');
        values.push(phone);
      }

      if (email) {
        updates.push('email = ?');
        values.push(email);
      }

      if (address !== undefined) {
        updates.push('address = ?');
        values.push(address);
      }

      if (taxNumber !== undefined) {
        updates.push('tax_number = ?');
        values.push(taxNumber);
      }

      if (taxRate !== undefined && taxRate >= 0 && taxRate <= 1) {
        updates.push('tax_rate = ?');
        values.push(taxRate);
      }

      if (currency) {
        updates.push('currency = ?');
        values.push(currency);
      }

      if (timezone) {
        updates.push('timezone = ?');
        values.push(timezone);
      }

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid fields to update',
        });
        return;
      }

      // Update business
      values.push(businessId);

      await pool.execute(
        `UPDATE businesses 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`,
        values,
      );

      res.json({
        success: true,
        message: 'Business profile updated successfully',
      });
    } catch (error) {
      console.error('Update business profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update business profile',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get all business settings
router.get(
  '/settings',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const category = req.query.category as string;

      let whereClause = 'WHERE business_id = ?';
      let queryParams: any[] = [businessId];

      if (category) {
        whereClause += ' AND category = ?';
        queryParams.push(category);
      }

      const [settings] = await pool.execute<any[]>(
        `SELECT setting_key, setting_value, setting_type, category, description
      FROM business_settings 
      ${whereClause}
      ORDER BY category, setting_key`,
        queryParams,
      );

      // Group settings by category
      const groupedSettings: any = {};
      settings.forEach((setting: any) => {
        if (!groupedSettings[setting.category]) {
          groupedSettings[setting.category] = {};
        }

        // Convert setting value based on type
        let value = setting.setting_value;
        switch (setting.setting_type) {
          case 'number':
            value = parseFloat(value);
            break;
          case 'boolean':
            value = value === 'true';
            break;
          case 'json':
            try {
              value = JSON.parse(value);
            } catch (e) {
              value = setting.setting_value;
            }
            break;
        }

        groupedSettings[setting.category][setting.setting_key] = {
          value,
          type: setting.setting_type,
          description: setting.description,
        };
      });

      res.json({
        success: true,
        data: {
          settings: groupedSettings,
        },
      });
    } catch (error) {
      console.error('Get business settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch business settings',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Update business settings
router.put(
  '/settings',
  authenticateToken,
  requirePermission('manage_business'),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const { settings } = req.body;

      if (!settings || typeof settings !== 'object') {
        res.status(400).json({
          success: false,
          message: 'Settings object is required',
        });
        return;
      }

      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        let settingValue = value;
        let settingType = 'string';

        // Determine setting type
        if (typeof value === 'number') {
          settingType = 'number';
          settingValue = value.toString();
        } else if (typeof value === 'boolean') {
          settingType = 'boolean';
          settingValue = value.toString();
        } else if (typeof value === 'object') {
          settingType = 'json';
          settingValue = JSON.stringify(value);
        }

        // Upsert setting
        await pool.execute(
          `INSERT INTO business_settings (business_id, setting_key, setting_value, setting_type)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value),
        setting_type = VALUES(setting_type),
        updated_at = CURRENT_TIMESTAMP`,
          [businessId, key, settingValue, settingType],
        );
      }

      res.json({
        success: true,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      console.error('Update business settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update business settings',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get business hours
router.get('/hours', authenticateToken, async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;

    const [businesses] = await pool.execute<any[]>(
      'SELECT business_hours FROM businesses WHERE id = ?',
      [businessId],
    );

    if (businesses.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Business not found',
      });
      return;
    }

    const businessHours = businesses[0].business_hours
      ? JSON.parse(businesses[0].business_hours)
      : null;

    res.json({
      success: true,
      data: {
        businessHours,
      },
    });
  } catch (error) {
    console.error('Get business hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business hours',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Update business hours
router.put(
  '/hours',
  authenticateToken,
  requirePermission('manage_business'),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const { businessHours } = req.body;

      if (!businessHours || typeof businessHours !== 'object') {
        res.status(400).json({
          success: false,
          message: 'Business hours object is required',
        });
        return;
      }

      // Validate business hours format
      const validDays = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];

      for (const day of validDays) {
        if (businessHours[day]) {
          const dayHours = businessHours[day];
          if (
            !dayHours.hasOwnProperty('open') ||
            !dayHours.hasOwnProperty('close') ||
            !dayHours.hasOwnProperty('closed')
          ) {
            res.status(400).json({
              success: false,
              message: `Invalid format for ${day}. Must include open, close, and closed properties`,
            });
            return;
          }
        }
      }

      // Update business hours
      await pool.execute(
        'UPDATE businesses SET business_hours = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(businessHours), businessId],
      );

      res.json({
        success: true,
        message: 'Business hours updated successfully',
      });
    } catch (error) {
      console.error('Update business hours error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update business hours',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get receipt templates
router.get(
  '/receipt-templates',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;

      const [templates] = await pool.execute<any[]>(
        `SELECT 
        id, template_name, template_type, header_text, footer_text, logo_url,
        show_business_info, show_tax_info, show_customer_info, paper_size,
        font_size, custom_fields, is_default, is_active, created_at, updated_at
      FROM receipt_templates
      WHERE business_id = ? AND is_active = TRUE
      ORDER BY is_default DESC, template_name`,
        [businessId],
      );

      // Parse custom_fields JSON
      const templatesWithParsedFields = templates.map((template: any) => ({
        ...template,
        custom_fields: template.custom_fields
          ? JSON.parse(template.custom_fields)
          : null,
      }));

      res.json({
        success: true,
        data: {
          templates: templatesWithParsedFields,
        },
      });
    } catch (error) {
      console.error('Get receipt templates error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch receipt templates',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Create receipt template
router.post(
  '/receipt-templates',
  authenticateToken,
  requirePermission('manage_business'),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;

      const {
        templateName,
        templateType = 'thermal',
        headerText,
        footerText,
        logoUrl,
        showBusinessInfo = true,
        showTaxInfo = true,
        showCustomerInfo = true,
        paperSize = '80mm',
        fontSize = 'normal',
        customFields,
        isDefault = false,
      } = req.body;

      if (!templateName) {
        res.status(400).json({
          success: false,
          message: 'Template name is required',
        });
        return;
      }

      // If setting as default, remove default from other templates
      if (isDefault) {
        await pool.execute(
          'UPDATE receipt_templates SET is_default = FALSE WHERE business_id = ?',
          [businessId],
        );
      }

      // Create template
      const [result] = await pool.execute<any>(
        `INSERT INTO receipt_templates 
      (business_id, template_name, template_type, header_text, footer_text, logo_url,
       show_business_info, show_tax_info, show_customer_info, paper_size, font_size,
       custom_fields, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          businessId,
          templateName,
          templateType,
          headerText,
          footerText,
          logoUrl,
          showBusinessInfo,
          showTaxInfo,
          showCustomerInfo,
          paperSize,
          fontSize,
          customFields ? JSON.stringify(customFields) : null,
          isDefault,
        ],
      );

      res.status(201).json({
        success: true,
        message: 'Receipt template created successfully',
        data: {
          templateId: result.insertId,
        },
      });
    } catch (error) {
      console.error('Create receipt template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create receipt template',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Update receipt template
router.put(
  '/receipt-templates/:id',
  authenticateToken,
  requirePermission('manage_business'),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const templateIdParam = req.params.id;

      if (!templateIdParam) {
        res.status(400).json({
          success: false,
          message: 'Template ID is required',
        });
        return;
      }

      const templateId = parseInt(templateIdParam);

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          message: 'Valid template ID is required',
        });
        return;
      }

      // Check if template exists
      const [existingTemplates] = await pool.execute<any[]>(
        'SELECT id FROM receipt_templates WHERE id = ? AND business_id = ?',
        [templateId, businessId],
      );

      if (existingTemplates.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Receipt template not found',
        });
        return;
      }

      // If setting as default, remove default from other templates
      if (req.body.isDefault) {
        await pool.execute(
          'UPDATE receipt_templates SET is_default = FALSE WHERE business_id = ? AND id != ?',
          [businessId, templateId],
        );
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      Object.keys(req.body).forEach(key => {
        const value = req.body[key];

        switch (key) {
          case 'templateName':
            updates.push('template_name = ?');
            values.push(value);
            break;
          case 'templateType':
            updates.push('template_type = ?');
            values.push(value);
            break;
          case 'headerText':
            updates.push('header_text = ?');
            values.push(value);
            break;
          case 'footerText':
            updates.push('footer_text = ?');
            values.push(value);
            break;
          case 'logoUrl':
            updates.push('logo_url = ?');
            values.push(value);
            break;
          case 'showBusinessInfo':
            updates.push('show_business_info = ?');
            values.push(value);
            break;
          case 'showTaxInfo':
            updates.push('show_tax_info = ?');
            values.push(value);
            break;
          case 'showCustomerInfo':
            updates.push('show_customer_info = ?');
            values.push(value);
            break;
          case 'paperSize':
            updates.push('paper_size = ?');
            values.push(value);
            break;
          case 'fontSize':
            updates.push('font_size = ?');
            values.push(value);
            break;
          case 'customFields':
            updates.push('custom_fields = ?');
            values.push(value ? JSON.stringify(value) : null);
            break;
          case 'isDefault':
            updates.push('is_default = ?');
            values.push(value);
            break;
        }
      });

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid fields to update',
        });
        return;
      }

      // Update template
      values.push(templateId, businessId);

      await pool.execute(
        `UPDATE receipt_templates 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND business_id = ?`,
        values,
      );

      res.json({
        success: true,
        message: 'Receipt template updated successfully',
      });
    } catch (error) {
      console.error('Update receipt template error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update receipt template',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get tax configurations
router.get(
  '/tax-configurations',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;

      const [taxConfigs] = await pool.execute<any[]>(
        `SELECT 
        id, tax_name, tax_rate, tax_type, applies_to, tax_number,
        is_inclusive, is_active, created_at, updated_at
      FROM tax_configurations
      WHERE business_id = ? AND is_active = TRUE
      ORDER BY tax_name`,
        [businessId],
      );

      res.json({
        success: true,
        data: {
          taxConfigurations: taxConfigs,
        },
      });
    } catch (error) {
      console.error('Get tax configurations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tax configurations',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Create tax configuration
router.post(
  '/tax-configurations',
  authenticateToken,
  requirePermission('manage_business'),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;

      const {
        taxName,
        taxRate,
        taxType = 'percentage',
        appliesTo = 'all',
        taxNumber,
        isInclusive = false,
      } = req.body;

      if (!taxName || taxRate === undefined) {
        res.status(400).json({
          success: false,
          message: 'Tax name and tax rate are required',
        });
        return;
      }

      if (taxRate < 0 || taxRate > 1) {
        res.status(400).json({
          success: false,
          message: 'Tax rate must be between 0 and 1 (0% to 100%)',
        });
        return;
      }

      // Create tax configuration
      const [result] = await pool.execute<any>(
        `INSERT INTO tax_configurations 
      (business_id, tax_name, tax_rate, tax_type, applies_to, tax_number, is_inclusive)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          businessId,
          taxName,
          taxRate,
          taxType,
          appliesTo,
          taxNumber,
          isInclusive,
        ],
      );

      res.status(201).json({
        success: true,
        message: 'Tax configuration created successfully',
        data: {
          taxConfigId: result.insertId,
        },
      });
    } catch (error) {
      console.error('Create tax configuration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create tax configuration',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get payment methods configuration
router.get(
  '/payment-methods',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;

      const [businesses] = await pool.execute<any[]>(
        'SELECT payment_methods FROM businesses WHERE id = ?',
        [businessId],
      );

      if (businesses.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Business not found',
        });
        return;
      }

      const paymentMethods = businesses[0].payment_methods
        ? JSON.parse(businesses[0].payment_methods)
        : [];

      // Available payment methods for Uganda
      const availablePaymentMethods = [
        {
          id: 'cash',
          name: 'Cash',
          description: 'Physical cash payments',
          enabled: paymentMethods.includes('cash'),
          icon: 'banknotes',
          category: 'traditional',
        },
        {
          id: 'mobile_money',
          name: 'Mobile Money',
          description: 'MTN Mobile Money, Airtel Money',
          enabled: paymentMethods.includes('mobile_money'),
          icon: 'device-mobile',
          category: 'digital',
          providers: ['MTN Mobile Money', 'Airtel Money'],
        },
        {
          id: 'bank_transfer',
          name: 'Bank Transfer',
          description: 'Direct bank transfers',
          enabled: paymentMethods.includes('bank_transfer'),
          icon: 'building-bank',
          category: 'digital',
        },
        {
          id: 'credit',
          name: 'Credit/Tab',
          description: 'Customer credit account',
          enabled: paymentMethods.includes('credit'),
          icon: 'credit-card',
          category: 'credit',
        },
        {
          id: 'card',
          name: 'Card Payment',
          description: 'Visa, Mastercard payments',
          enabled: paymentMethods.includes('card'),
          icon: 'credit-card',
          category: 'digital',
        },
      ];

      res.json({
        success: true,
        data: {
          paymentMethods: availablePaymentMethods,
          enabled: paymentMethods,
        },
      });
    } catch (error) {
      console.error('Get payment methods error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment methods',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Update payment methods
router.put(
  '/payment-methods',
  authenticateToken,
  requirePermission('manage_business'),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const { enabledMethods } = req.body;

      if (!Array.isArray(enabledMethods)) {
        res.status(400).json({
          success: false,
          message: 'Enabled methods must be an array',
        });
        return;
      }

      // Validate payment methods
      const validMethods = [
        'cash',
        'mobile_money',
        'bank_transfer',
        'credit',
        'card',
      ];
      const invalidMethods = enabledMethods.filter(
        method => !validMethods.includes(method),
      );

      if (invalidMethods.length > 0) {
        res.status(400).json({
          success: false,
          message: `Invalid payment methods: ${invalidMethods.join(', ')}`,
        });
        return;
      }

      // Update payment methods
      await pool.execute(
        'UPDATE businesses SET payment_methods = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(enabledMethods), businessId],
      );

      res.json({
        success: true,
        message: 'Payment methods updated successfully',
      });
    } catch (error) {
      console.error('Update payment methods error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment methods',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get notification preferences
router.get(
  '/notifications',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;

      const [businesses] = await pool.execute<any[]>(
        'SELECT notification_preferences FROM businesses WHERE id = ?',
        [businessId],
      );

      if (businesses.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Business not found',
        });
        return;
      }

      const notificationPreferences = businesses[0].notification_preferences
        ? JSON.parse(businesses[0].notification_preferences)
        : {};

      res.json({
        success: true,
        data: {
          notifications: notificationPreferences,
        },
      });
    } catch (error) {
      console.error('Get notification preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification preferences',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Update notification preferences
router.put(
  '/notifications',
  authenticateToken,
  requirePermission('manage_business'),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const { notifications } = req.body;

      if (!notifications || typeof notifications !== 'object') {
        res.status(400).json({
          success: false,
          message: 'Notifications object is required',
        });
        return;
      }

      // Update notification preferences
      await pool.execute(
        'UPDATE businesses SET notification_preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(notifications), businessId],
      );

      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
      });
    } catch (error) {
      console.error('Update notification preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get business performance summary (for settings overview)
router.get(
  '/performance',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const days = parseInt(req.query.days as string) || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get business performance metrics
      const [performance] = await pool.execute<any[]>(
        `SELECT 
        COUNT(DISTINCT s.id) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COUNT(DISTINCT s.customer_id) as unique_customers,
        COUNT(DISTINCT DATE(s.sale_date)) as active_days,
        AVG(s.total_amount) as avg_sale_value
      FROM sales s
      WHERE s.business_id = ? AND s.sale_date >= ? AND s.status = 'completed'`,
        [businessId, startDate.toISOString()],
      );

      // Get product and customer counts
      const [counts] = await pool.execute<any[]>(
        `SELECT 
        (SELECT COUNT(*) FROM products WHERE business_id = ? AND is_active = TRUE) as total_products,
        (SELECT COUNT(*) FROM customers WHERE business_id = ? AND is_active = TRUE) as total_customers,
        (SELECT COUNT(*) FROM categories WHERE business_id = ? AND is_active = TRUE) as total_categories`,
        [businessId, businessId, businessId],
      );

      // Get low stock alerts count
      const [alerts] = await pool.execute<any[]>(
        `SELECT 
        COUNT(CASE WHEN p.current_stock = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN p.current_stock <= p.min_stock_level AND p.current_stock > 0 THEN 1 END) as low_stock
      FROM products p
      WHERE p.business_id = ? AND p.is_active = TRUE`,
        [businessId],
      );

      res.json({
        success: true,
        data: {
          period: `${days} days`,
          performance: performance[0],
          inventory: {
            ...counts[0],
            ...alerts[0],
          },
        },
      });
    } catch (error) {
      console.error('Get business performance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch business performance',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Export business settings (for backup)
router.get(
  '/export',
  authenticateToken,
  requirePermission('manage_business'),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;

      // Get all business data for export
      const [businessData] = await pool.execute<any[]>(
        'SELECT * FROM businesses WHERE id = ?',
        [businessId],
      );

      const [settings] = await pool.execute<any[]>(
        'SELECT * FROM business_settings WHERE business_id = ?',
        [businessId],
      );

      const [receiptTemplates] = await pool.execute<any[]>(
        'SELECT * FROM receipt_templates WHERE business_id = ?',
        [businessId],
      );

      const [taxConfigurations] = await pool.execute<any[]>(
        'SELECT * FROM tax_configurations WHERE business_id = ?',
        [businessId],
      );

      const exportData = {
        exportDate: new Date().toISOString(),
        businessProfile: businessData[0],
        settings,
        receiptTemplates,
        taxConfigurations,
      };

      res.json({
        success: true,
        data: exportData,
      });
    } catch (error) {
      console.error('Export business settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export business settings',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Business settings routes are working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
