import { Router } from 'express';
import {
  getDashboardProgress,
  getDashboardSummary,
} from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/summary', requireAuth, getDashboardSummary);
router.get('/progress', requireAuth, getDashboardProgress);

export default router;
