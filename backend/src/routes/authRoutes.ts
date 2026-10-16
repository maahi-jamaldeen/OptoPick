import { Router } from 'express';
import { login, logout, getMe, changePassword, forgotPassword, verifyOtp, resetPassword } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);
router.post('/change-password', authMiddleware, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
