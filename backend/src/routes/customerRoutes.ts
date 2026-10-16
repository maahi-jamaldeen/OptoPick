import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  checkDuplicateCustomer,
} from '../controllers/customerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getCustomers);
router.get('/check-duplicate', checkDuplicateCustomer);
router.post('/', createCustomer);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
