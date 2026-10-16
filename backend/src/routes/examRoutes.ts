import { Router } from 'express';
import { createExamination, getPrescriptionHistory, getLatestPrescription } from '../controllers/examController.js';
import { authMiddleware, roleGuard } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Only Administrator / Optometrist can create/sign examinations
router.post('/', roleGuard(['ADMIN']), createExamination);

// Both roles can read historical prescriptions
router.get('/customer/:customerId', getPrescriptionHistory);
router.get('/customer/:customerId/latest', getLatestPrescription);

export default router;
