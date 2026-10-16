import { Router } from 'express';
import {
  getFrames, createFrame, updateFrame,
  getLenses, createLens, updateLens,
  getAccessories, createAccessory, updateAccessory
} from '../controllers/productController.js';
import {
  getSuppliers, createSupplier, updateSupplier, deleteSupplier
} from '../controllers/supplierController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Frames
router.get('/frames', getFrames);
router.post('/frames', createFrame);
router.put('/frames/:id', updateFrame);

// Lenses
router.get('/lenses', getLenses);
router.post('/lenses', createLens);
router.put('/lenses/:id', updateLens);

// Accessories
router.get('/accessories', getAccessories);
router.post('/accessories', createAccessory);
router.put('/accessories/:id', updateAccessory);

// Suppliers
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

export default router;
