import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

export const createPromoCode = async (req: AuthRequest, res: Response) => {
  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', req.body.event)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .insert({
        code: req.body.code.toUpperCase(),
        event_id: req.body.event,
        discount_type: req.body.discountType,
        discount_value: req.body.discountValue,
        max_uses: req.body.maxUses || 100,
        min_order_amount: req.body.minOrderAmount || 0,
        max_discount_amount: req.body.maxDiscountAmount || null,
        starts_at: req.body.startsAt || null,
        expires_at: req.body.expiresAt || null,
        is_active: req.body.isActive !== undefined ? req.body.isActive : true,
        created_by: req.user!.id,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({ success: true, promo });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const validatePromoCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code, eventId, orderAmount } = req.query;

    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', (code as string).toUpperCase())
      .eq('event_id', eventId)
      .eq('is_active', true)
      .maybeSingle();

    if (!promo || error) {
      return res.status(400).json({ valid: false, message: 'Invalid promo code' });
    }

    if (promo.current_uses >= promo.max_uses) {
      return res.status(400).json({ valid: false, message: 'Promo code has expired' });
    }

    if (promo.expires_at && new Date() > new Date(promo.expires_at)) {
      return res.status(400).json({ valid: false, message: 'Promo code has expired' });
    }

    const amount = parseFloat(orderAmount as string);
    if (promo.min_order_amount > amount) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order amount is $${promo.min_order_amount}`,
      });
    }

    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = (amount * promo.discount_value) / 100;
      if (promo.max_discount_amount && discountAmount > promo.max_discount_amount) {
        discountAmount = promo.max_discount_amount;
      }
    } else {
      discountAmount = promo.discount_value;
    }

    res.json({
      valid: true,
      promo: {
        code: promo.code,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        discountAmount: Math.round(discountAmount * 100) / 100,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
