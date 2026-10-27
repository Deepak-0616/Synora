import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const authLimiter = createRateLimiter(60 * 1000, 20);

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authenticateToken, authController.getMe);
router.patch('/me', authenticateToken, authController.updateMe);

export default router;
