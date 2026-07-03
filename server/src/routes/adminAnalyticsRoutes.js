import express from 'express';
import { getAdminOverviewAnalytics } from '../controllers/adminAnalyticsController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/overview', protect, authorizeRoles('admin'), getAdminOverviewAnalytics);

export default router;
