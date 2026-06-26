import { Router } from 'express';
import {
  createOrder, getOrders, getOrder, checkInAttendee, cancelOrder, initiateRefund,
} from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.post('/', protect, createOrder);
router.get('/', protect, getOrders);
router.get('/:orderNumber', protect, getOrder);
router.put('/:orderNumber/checkin', protect, authorize('organizer', 'admin'), checkInAttendee);
router.put('/:orderNumber/refund', protect, authorize('organizer', 'admin'), initiateRefund);
router.put('/:id/cancel', protect, cancelOrder);

export default router;
