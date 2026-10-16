"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_js_1 = require("../controllers/productController.js");
const supplierController_js_1 = require("../controllers/supplierController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authMiddleware);
// Frames
router.get('/frames', productController_js_1.getFrames);
router.post('/frames', productController_js_1.createFrame);
// Lenses
router.get('/lenses', productController_js_1.getLenses);
router.post('/lenses', productController_js_1.createLens);
// Accessories
router.get('/accessories', productController_js_1.getAccessories);
router.post('/accessories', productController_js_1.createAccessory);
// Suppliers
router.get('/suppliers', supplierController_js_1.getSuppliers);
router.post('/suppliers', supplierController_js_1.createSupplier);
exports.default = router;
