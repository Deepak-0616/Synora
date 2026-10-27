import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as bureauCtrl from '../controllers/bureauController.js';

const router = Router();

// Bureaus list is accessible to authenticated users (and for routing forms)
router.get('/', authenticateToken, bureauCtrl.listBureaus);
router.get('/:bureauId/officers', authenticateToken, bureauCtrl.getBureauOfficers);

export default router;
