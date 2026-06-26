import { Response } from 'express';
import PromoCode from '../models/PromoCode';
import Event from '../models/Event';
import { AuthRequest } from '../middleware/auth';

export const createPromoCode = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.body.event);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (
      event.organizer.toString() !== req.user!._id.toString() &&
      req.user!.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const promo = await PromoCode.create({
      ...req.body,
      createdBy: req.user!._id,
    });

    res.status(201).json({ success: true, promo });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const validatePromoCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code, eventId, orderAmount } = req.query;

    const promo = await PromoCode.findOne({
      code: (code as string).toUpperCase(),
      event: eventId,
      isActive: true,
    });

    if (!promo) {
      return res.status(400).json({ valid: false, message: 'Invalid promo code' });
    }

    if (promo.currentUses >= promo.maxUses) {
      return res.status(400).json({ valid: false, message: 'Promo code has expired' });
    }

    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return res.status(400).json({ valid: false, message: 'Promo code has expired' });
    }

    const amount = parseFloat(orderAmount as string);
    if (promo.minOrderAmount > amount) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount is $${promo.minOrderAmount}`,
      });
    }

    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      discountAmount = (amount * promo.discountValue) / 100;
      if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
        discountAmount = promo.maxDiscountAmount;
      }
    } else {
      discountAmount = promo.discountValue;
    }

    res.json({
      valid: true,
      promo: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
