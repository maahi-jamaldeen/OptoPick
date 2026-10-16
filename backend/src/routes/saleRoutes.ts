import { Router } from 'express';
import { createSale, getSales, getSaleById, addPayment, updateOrderStatus } from '../controllers/saleController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createSale);
router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/:id/payments', addPayment);
router.patch('/:id/order-status', updateOrderStatus);

export default router;
