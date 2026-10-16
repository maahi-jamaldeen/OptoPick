"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lensIQController_js_1 = require("../controllers/lensIQController.js");
const forecastController_js_1 = require("../controllers/forecastController.js");
const recallController_js_1 = require("../controllers/recallController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authMiddleware);
// LensIQ: available to both roles
router.post('/lens-iq/recommend', lensIQController_js_1.recommendLenses);
// OptoForecast: available ONLY to Administrator / Optometrist
router.get('/opto-forecast', (0, authMiddleware_js_1.roleGuard)(['ADMIN']), forecastController_js_1.getOptoForecast);
// OptoRecall lifecycle
router.get('/opto-recall/candidates', recallController_js_1.getRecallCandidates);
router.post('/opto-recall/generate-draft', recallController_js_1.generateRecallDraft);
router.post('/opto-recall/approve', recallController_js_1.approveAndDispatch);
exports.default = router;
