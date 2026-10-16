"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.resetPasswordWithOtpSchema = exports.verifyOtpSchema = exports.forgotPasswordSchema = exports.changePasswordSchema = exports.createUserSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'Username is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.createUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters').max(50),
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    full_name: zod_1.z.string().min(2, 'Full name is required').max(100),
    role: zod_1.z.enum(['ADMIN', 'STAFF']),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid registered clinic email address'),
});
exports.verifyOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid registered clinic email address'),
    otp: zod_1.z.string().length(6, 'Verification code must be exactly 6 digits'),
});
exports.resetPasswordWithOtpSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid registered clinic email address'),
    otp: zod_1.z.string().length(6, 'Verification code must be exactly 6 digits'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required').optional(),
    email: zod_1.z.string().email().optional(),
    otp: zod_1.z.string().optional(),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
