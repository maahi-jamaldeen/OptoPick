import { Router } from 'express';
import { recommendLenses } from '../controllers/lensIQController.js';
import { getOptoForecast } from '../controllers/forecastController.js';
import { getRecallCandidates, generateRecallDraft, approveAndDispatch } from '../controllers/recallController.js';
import { authMiddleware, roleGuard } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// LensIQ: available to both roles
router.post('/lens-iq/recommend', recommendLenses);

// OptoForecast: available ONLY to Administrator / Optometrist
router.get('/opto-forecast', roleGuard(['ADMIN']), getOptoForecast);

// OptoRecall lifecycle
router.get('/opto-recall/candidates', getRecallCandidates);
router.post('/opto-recall/generate-draft', generateRecallDraft);
router.post('/opto-recall/approve', approveAndDispatch);

export default router;
