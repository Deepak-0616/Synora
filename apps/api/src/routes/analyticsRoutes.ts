import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as analyticsCtrl from '../controllers/analyticsController.js';

const router = Router();

router.use(authenticateToken);

router.get('/overview', analyticsCtrl.getOverview);
router.get('/trends', analyticsCtrl.getTrends);
router.get('/bureaus', analyticsCtrl.getBureausPerformance);
router.get('/status-distribution', analyticsCtrl.getStatusDistribution);
router.get('/category-distribution', analyticsCtrl.getCategoryDistribution);
router.get('/export-csv', analyticsCtrl.exportCsv);

export default router;
