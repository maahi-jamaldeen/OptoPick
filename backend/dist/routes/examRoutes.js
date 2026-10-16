"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const examController_js_1 = require("../controllers/examController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authMiddleware);
// Only Administrator / Optometrist can create/sign examinations
router.post('/', (0, authMiddleware_js_1.roleGuard)(['ADMIN']), examController_js_1.createExamination);
// Both roles can read historical prescriptions
router.get('/customer/:customerId', examController_js_1.getPrescriptionHistory);
router.get('/customer/:customerId/latest', examController_js_1.getLatestPrescription);
exports.default = router;
