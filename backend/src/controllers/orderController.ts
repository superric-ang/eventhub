import { Response } from 'express';
import Order from '../models/Order';
import Event from '../models/Event';
import PromoCode from '../models/PromoCode';
import { AuthRequest } from '../middleware/auth';
import { generateOrderNumber } from '../utils/generateOrderNumber';
import { calculateFees } from '../utils/calculateFees';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, items, attendeeDetails, promoCode, paymentMethod } =
      req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not available' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const tier = (event.ticketTiers as any).id(item.ticketTierId);
      if (!tier) {
        return res
          .status(400)
          .json({ message: `Ticket tier ${item.ticketTierId} not found` });
      }

      const available = tier.quantity - tier.quantitySold;
      if (available < item.quantity) {
        return res
          .status(400)
          .json({
            message: `Not enough tickets for "${tier.name}". Only ${available} left`,
          });
      }

      const totalPrice = tier.price * item.quantity;
      totalAmount += totalPrice;

      orderItems.push({
        ticketTierId: tier._id,
        ticketTierName: tier.name,
        quantity: item.quantity,
        unitPrice: tier.price,
        totalPrice,
      });
    }

    let discountAmount = 0;
    if (promoCode) {
      const promo = await PromoCode.findOne({
        code: promoCode.toUpperCase(),
        event: eventId,
        isActive: true,
      });

      if (!promo) {
        return res.status(400).json({ message: 'Invalid promo code' });
      }

      if (promo.currentUses >= promo.maxUses) {
        return res.status(400).json({ message: 'Promo code has expired' });
      }

      if (promo.expiresAt && new Date() > promo.expiresAt) {
        return res.status(400).json({ message: 'Promo code has expired' });
      }

      if (promo.minOrderAmount > totalAmount) {
        return res
          .status(400)
          .json({
            message: `Minimum order amount is $${promo.minOrderAmount}`,
          });
      }

      if (promo.discountType === 'percentage') {
        discountAmount = (totalAmount * promo.discountValue) / 100;
        if (
          promo.maxDiscountAmount &&
          discountAmount > promo.maxDiscountAmount
        ) {
          discountAmount = promo.maxDiscountAmount;
        }
      } else {
        discountAmount = promo.discountValue;
      }

      promo.currentUses += 1;
      await promo.save();
    }

    const amountAfterDiscount = totalAmount - discountAmount;
    const fees = calculateFees(amountAfterDiscount);
    const grandTotal = Math.round((amountAfterDiscount + fees.totalFees) * 100) / 100;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      event: eventId,
      buyer: req.user!._id,
      items: orderItems,
      totalAmount,
      serviceFee: fees.serviceFee,
      paymentFee: fees.paymentFee,
      grandTotal,
      status: 'confirmed',
      paymentMethod: paymentMethod || 'card',
      attendeeDetails,
      promoCode: promoCode?.toUpperCase(),
      discountAmount,
    });

    for (const item of items) {
      const tier = (event.ticketTiers as any).id(item.ticketTierId);
      if (tier) {
        tier.quantitySold += item.quantity;
      }
    }
    event.currentAttendees += items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0
    );
    await event.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('event', 'title startDate venue')
      .populate('buyer', 'firstName lastName email');

    res.status(201).json({ success: true, order: populatedOrder });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const query: Record<string, any> = {};

    if (req.user!.role === 'organizer') {
      const events = await Event.find({ organizer: req.user!._id }).select('_id');
      query.event = { $in: events.map((e) => e._id) };
    } else {
      query.buyer = req.user!._id;
    }

    if (status) query.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('event', 'title startDate endDate venue coverImage')
      .populate('buyer', 'firstName lastName email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({
      orderNumber: req.params.orderNumber,
    })
      .populate('event', 'title description startDate endDate venue coverImage organizer')
      .populate('buyer', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const checkInAttendee = async (req: AuthRequest, res: Response) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber }).populate(
      'event',
      'organizer'
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const event = await Event.findById(order.event);
    if (
      event?.organizer.toString() !== req.user!._id.toString() &&
      req.user!.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.checkedIn) {
      return res.status(400).json({ message: 'Already checked in' });
    }

    order.checkedIn = true;
    order.checkedInAt = new Date();
    await order.save();

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (
      order.buyer.toString() !== req.user!._id.toString() &&
      req.user!.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    order.status = 'cancelled';
    await order.save();

    const event = await Event.findById(order.event);
    if (event) {
      for (const item of order.items) {
        const tier = (event.ticketTiers as any).id(item.ticketTierId);
        if (tier) {
          tier.quantitySold -= item.quantity;
        }
      }
      event.currentAttendees -= order.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      await event.save();
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
