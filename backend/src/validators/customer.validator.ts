import { z } from 'zod';

// Phone number validation for Uganda format (0706586256)
const ugandaPhoneRegex = /^0[0-9]{9}$/;

export const createCustomerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format').optional(),
    phone: z
      .string()
      .regex(
        ugandaPhoneRegex,
        'Phone number must be in format 0XXXXXXXXX (e.g., 0706586256)',
      ),
    address: z.string().optional(),
    city: z.string().optional(),
    customerType: z.enum(['regular', 'vip', 'wholesale']).default('regular'),
    notes: z.string().optional(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(
        ugandaPhoneRegex,
        'Phone number must be in format 0XXXXXXXXX (e.g., 0706586256)',
      )
      .optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    customerType: z.enum(['regular', 'vip', 'wholesale']).optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});
