import { z } from 'zod';

// Phone number validation for Uganda format (0706586256)
const ugandaPhoneRegex = /^0[0-9]{9}$/;

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    phone: z
      .string()
      .regex(
        ugandaPhoneRegex,
        'Phone number must be in format 0XXXXXXXXX (e.g., 0706586256)',
      ),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    businessName: z
      .string()
      .min(2, 'Business name must be at least 2 characters'),
    businessType: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    emailOrPhone: z.string().min(1, 'Email or phone is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updateProfileSchema = z.object({
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
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters'),
  }),
});
