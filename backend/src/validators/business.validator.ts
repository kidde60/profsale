import { z } from 'zod';

// Phone number validation for Uganda format (0706586256)
const ugandaPhoneRegex = /^0[0-9]{9}$/;

export const updateBusinessSchema = z.object({
  body: z.object({
    businessName: z
      .string()
      .min(2, 'Business name must be at least 2 characters')
      .optional(),
    businessType: z.string().optional(),
    businessRegistrationNumber: z.string().optional(),
    taxIdentificationNumber: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    phone: z
      .string()
      .regex(
        ugandaPhoneRegex,
        'Phone number must be in format 0XXXXXXXXX (e.g., 0706586256)',
      )
      .optional(),
    email: z.string().email('Invalid email format').optional(),
    website: z.string().url('Invalid URL format').optional(),
    logo: z.string().optional(),
    currency: z.string().default('UGX').optional(),
    taxRate: z.number().min(0).max(100).optional(),
    receiptFooter: z.string().optional(),
  }),
});

export const businessSettingsSchema = z.object({
  body: z.object({
    autoBackup: z.boolean().optional(),
    lowStockAlert: z.boolean().optional(),
    lowStockThreshold: z.number().min(0).optional(),
    enableNotifications: z.boolean().optional(),
    defaultPaymentMethod: z
      .enum(['cash', 'mobile_money', 'bank_transfer', 'credit'])
      .optional(),
    allowNegativeStock: z.boolean().optional(),
    requireCustomerForSales: z.boolean().optional(),
  }),
});
