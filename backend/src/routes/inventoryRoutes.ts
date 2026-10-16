import { Router } from 'express';
import { getInventoryStatus, recordStockIn, getMovements, getGoodsReceipts } from '../controllers/inventoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/status', getInventoryStatus);
router.post('/stock-in', recordStockIn);
router.get('/movements', getMovements);
router.get('/goods-receipts', getGoodsReceipts);

export default router;
