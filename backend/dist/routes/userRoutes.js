"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_js_1 = require("../controllers/userController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
// Strict RBAC: All user management endpoints require ADMIN role (SUPER_ADMIN or ADMIN)
router.use(authMiddleware_js_1.authMiddleware);
router.use((0, authMiddleware_js_1.roleGuard)(['ADMIN']));
router.get('/', userController_js_1.getUsers);
router.post('/', userController_js_1.createUser);
router.patch('/:id/status', userController_js_1.toggleUserStatus);
router.get('/audit-logs', userController_js_1.getAuditLogs);
exports.default = router;
