import { Router } from 'express';
import { getUsers, createUser, toggleUserStatus, getAuditLogs } from '../controllers/userController.js';
import { authMiddleware, roleGuard } from '../middleware/authMiddleware.js';

const router = Router();

// Strict RBAC: All user management endpoints require ADMIN role (SUPER_ADMIN or ADMIN)
router.use(authMiddleware);
router.use(roleGuard(['ADMIN']));

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/status', toggleUserStatus);
router.get('/audit-logs', getAuditLogs);

export default router;
