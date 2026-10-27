import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import * as userCtrl from '../controllers/userController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireRoles('system_admin', 'bureau_admin', 'reviewer'), userCtrl.listUsers);
router.patch('/:userId/role', requireRoles('system_admin'), userCtrl.updateUserRole);
router.get('/audit-logs', requireRoles('system_admin', 'reviewer'), userCtrl.getAuditLogs);

export default router;
