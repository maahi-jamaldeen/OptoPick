import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/metrics', getDashboardMetrics);

export default router;
