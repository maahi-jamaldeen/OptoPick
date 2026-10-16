import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name is required').max(100),
  role: z.enum(['ADMIN', 'STAFF']),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid registered clinic email address'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid registered clinic email address'),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
});

export const resetPasswordWithOtpSchema = z.object({
  email: z.string().email('Please enter a valid registered clinic email address'),
  otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required').optional(),
  email: z.string().email().optional(),
  otp: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});
