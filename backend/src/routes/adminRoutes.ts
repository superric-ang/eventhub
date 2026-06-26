import { Router } from 'express';
import {
  getSiteSettings, updateSiteSettings,
  getUsers, getUserById, updateUserRole,
  getDashboardStats,
  generateReport, getReports,
  getPayouts, approvePayout, markPayoutPaid,
  getColorSchemes,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/settings', getSiteSettings);
router.put('/settings', protect, authorize('admin'), updateSiteSettings);
router.get('/users', protect, authorize('admin'), getUsers);
router.get('/users/:id', protect, authorize('admin'), getUserById);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);
router.get('/stats', protect, authorize('admin'), getDashboardStats);
router.post('/reports/generate', protect, authorize('admin'), generateReport);
router.get('/reports', protect, authorize('admin'), getReports);
router.get('/payouts', protect, authorize('admin'), getPayouts);
router.put('/payouts/:id/approve', protect, authorize('admin'), approvePayout);
router.put('/payouts/:id/pay', protect, authorize('admin'), markPayoutPaid);
router.get('/color-schemes', getColorSchemes);

export default router;
