// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import {
  body,
  query,
  param,
  validationResult,
  ValidationChain,
} from 'express-validator';

// Validation error handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

// Common validation rules
export const validationRules = {
  // User validation
  userRegistration: [
    body('phone')
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number')
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10-15 characters'),

    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),

    body('firstName')
      .isLength({ min: 1, max: 100 })
      .withMessage(
        'First name is required and must be less than 100 characters',
      )
      .trim()
      .escape(),

    body('lastName')
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name is required and must be less than 100 characters')
      .trim()
      .escape(),

    body('businessName')
      .isLength({ min: 1, max: 255 })
      .withMessage(
        'Business name is required and must be less than 255 characters',
      )
      .trim()
      .escape(),

    body('businessType')
      .isIn(['retail', 'wholesale', 'service', 'restaurant', 'other'])
      .withMessage('Invalid business type'),

    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8-128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
  ],

  userLogin: [
    body('login').notEmpty().withMessage('Phone number or email is required'),

    body('password').notEmpty().withMessage('Password is required'),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),

    body('newPassword')
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8-128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      ),
  ],

  // Product validation
  productCreate: [
    body('name')
      .isLength({ min: 1, max: 255 })
      .withMessage(
        'Product name is required and must be less than 255 characters',
      )
      .trim()
      .escape(),

    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters')
      .trim(),

    body('barcode')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Barcode must be less than 100 characters')
      .trim(),

    body('buyingPrice')
      .isFloat({ min: 0 })
      .withMessage('Buying price must be a positive number'),

    body('sellingPrice')
      .isFloat({ min: 0 })
      .withMessage('Selling price must be a positive number')
      .custom((value, { req }) => {
        if (parseFloat(value) <= parseFloat(req.body.buyingPrice)) {
          throw new Error('Selling price must be greater than buying price');
        }
        return true;
      }),

    body('currentStock')
      .isInt({ min: 0 })
      .withMessage('Current stock must be a non-negative integer'),

    body('minStockLevel')
      .isInt({ min: 0 })
      .withMessage('Minimum stock level must be a non-negative integer'),

    body('categoryId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer'),

    body('unit')
      .isIn(['pieces', 'kg', 'liters', 'meters', 'boxes', 'packs'])
      .withMessage('Invalid unit type'),
  ],

  productUpdate: [
    body('name')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Product name must be less than 255 characters')
      .trim()
      .escape(),

    body('sellingPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Selling price must be a positive number'),

    body('currentStock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Current stock must be a non-negative integer'),
  ],

  // Sales validation
  saleCreate: [
    body('customerName')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Customer name must be less than 255 characters')
      .trim()
      .escape(),

    body('customerPhone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Please provide a valid customer phone number'),

    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required for sale'),

    body('items.*.productId')
      .isInt({ min: 1 })
      .withMessage('Product ID must be a positive integer'),

    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),

    body('items.*.unitPrice')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a positive number'),

    body('paymentMethod')
      .isIn(['cash', 'mobile_money', 'bank_transfer', 'credit'])
      .withMessage('Invalid payment method'),

    body('discountAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount amount must be a non-negative number'),

    body('taxRate')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Tax rate must be between 0 and 1'),
  ],

  // Customer validation
  customerCreate: [
    body('name')
      .isLength({ min: 1, max: 255 })
      .withMessage(
        'Customer name is required and must be less than 255 characters',
      )
      .trim()
      .escape(),

    body('phone')
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),

    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),

    body('address')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Address must be less than 500 characters')
      .trim(),

    body('customerType')
      .optional()
      .isIn(['regular', 'vip', 'wholesale'])
      .withMessage('Invalid customer type'),
  ],

  // Expense validation
  expenseCreate: [
    body('description')
      .isLength({ min: 1, max: 255 })
      .withMessage(
        'Expense description is required and must be less than 255 characters',
      )
      .trim()
      .escape(),

    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),

    body('category')
      .isLength({ min: 1, max: 100 })
      .withMessage('Category is required and must be less than 100 characters')
      .trim()
      .escape(),

    body('expenseDate')
      .isISO8601()
      .withMessage('Please provide a valid date in ISO format'),

    body('paymentMethod')
      .isIn(['cash', 'bank_transfer', 'mobile_money', 'credit_card'])
      .withMessage('Invalid payment method'),
  ],

  // Query parameter validations
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],

  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be in ISO format'),

    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be in ISO format')
      .custom((value, { req }) => {
        if (
          req.query?.startDate &&
          value &&
          new Date(value) < new Date(req.query?.startDate as string)
        ) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
  ],

  // ID parameter validation
  idParam: [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  ],

  // Barcode parameter validation
  barcodeParam: [
    param('barcode')
      .isLength({ min: 1, max: 100 })
      .withMessage('Barcode is required and must be less than 100 characters')
      .trim(),
  ],
};

// Sanitization helpers
export const sanitizeInput = {
  trim: (value: string): string => value.trim(),
  escape: (value: string): string => value.replace(/[<>]/g, ''),
  normalizePhone: (value: string): string => {
    // Normalize phone number to international format
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '+256' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('+')) {
      return '+256' + cleaned;
    }
    return cleaned;
  },
};

// Custom validators
export const customValidators = {
  isUgandanPhone: (value: string): boolean => {
    const phoneRegex = /^(\+256|0)[7-9]\d{8}$/;
    return phoneRegex.test(value);
  },

  isValidCurrency: (value: number): boolean => {
    return value >= 0 && Number.isFinite(value);
  },

  isValidBusinessType: (value: string): boolean => {
    const validTypes = [
      'retail',
      'wholesale',
      'service',
      'restaurant',
      'other',
    ];
    return validTypes.includes(value);
  },
};
