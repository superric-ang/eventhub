import { Router } from 'express';
import { createPromoCode, validatePromoCode } from '../controllers/promoController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', protect, createPromoCode);
router.get('/validate', validatePromoCode);

export default router;
