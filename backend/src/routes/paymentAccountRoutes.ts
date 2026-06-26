import { Router } from 'express';
import {
  getMyPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
  setDefaultPaymentAccount,
} from '../controllers/paymentAccountController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getMyPaymentAccounts);
router.post('/', protect, createPaymentAccount);
router.put('/:id', protect, updatePaymentAccount);
router.delete('/:id', protect, deletePaymentAccount);
router.put('/:id/default', protect, setDefaultPaymentAccount);

export default router;
