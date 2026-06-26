import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';
import { generateOrderNumber } from '../utils/generateOrderNumber';
import { calculateFees } from '../utils/calculateFees';
import { transformOrder, transformEvent } from '../utils/transformers';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, items, attendeeDetails, promoCode, paymentMethod } = req.body;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not available' });
    }

    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const tiers = event.ticket_tiers || [];
      const tier = tiers.find((t: any) => t._id === item.ticketTierId);

      if (!tier) {
        return res.status(400).json({
          message: `Ticket tier ${item.ticketTierId} not found`,
        });
      }

      const available = tier.quantity - (tier.quantitySold || 0);
      if (available < item.quantity) {
        return res.status(400).json({
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
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('event_id', eventId)
        .eq('is_active', true)
        .maybeSingle();

      if (!promo) {
        return res.status(400).json({ message: 'Invalid promo code' });
      }

      if (promo.current_uses >= promo.max_uses) {
        return res.status(400).json({ message: 'Promo code has expired' });
      }

      if (promo.expires_at && new Date() > new Date(promo.expires_at)) {
        return res.status(400).json({ message: 'Promo code has expired' });
      }

      if (promo.min_order_amount > totalAmount) {
        return res.status(400).json({
          message: `Minimum order amount is $${promo.min_order_amount}`,
        });
      }

      if (promo.discount_type === 'percentage') {
        discountAmount = (totalAmount * promo.discount_value) / 100;
        if (promo.max_discount_amount && discountAmount > promo.max_discount_amount) {
          discountAmount = promo.max_discount_amount;
        }
      } else {
        discountAmount = promo.discount_value;
      }

      await supabase
        .from('promo_codes')
        .update({ current_uses: promo.current_uses + 1 })
        .eq('id', promo.id);
    }

    const amountAfterDiscount = totalAmount - discountAmount;
    const fees = calculateFees(amountAfterDiscount);
    const grandTotal = Math.round((amountAfterDiscount + fees.totalFees) * 100) / 100;

    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id: eventId,
        buyer_id: req.user!.id,
        items: orderItems,
        total_amount: totalAmount,
        service_fee: fees.serviceFee,
        payment_fee: fees.paymentFee,
        grand_total: grandTotal,
        status: 'confirmed',
        payment_method: paymentMethod || 'card',
        attendee_details: attendeeDetails || [],
        promo_code: promoCode?.toUpperCase() || null,
        discount_amount: discountAmount,
      })
      .select()
      .single();

    if (orderError) {
      return res.status(400).json({ message: orderError.message });
    }

    const updatedTiers = event.ticket_tiers.map((tier: any) => {
      const item = items.find((i: any) => i.ticketTierId === tier._id);
      if (item) {
        return {
          ...tier,
          quantitySold: (tier.quantitySold || 0) + item.quantity,
        };
      }
      return tier;
    });

    const totalNewAttendees = items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    await supabase
      .from('events')
      .update({
        ticket_tiers: updatedTiers,
        current_attendees: (event.current_attendees || 0) + totalNewAttendees,
      })
      .eq('id', eventId);

    const { data: buyerData } = await supabase.auth.admin.listUsers();
    const buyer = (buyerData?.users || []).find((u: any) => u.id === req.user!.id);

    const createdOrder = transformOrder(order);
    createdOrder.event = { title: event.title, startDate: event.start_date, venue: event.venue };
    createdOrder.buyer = {
      firstName: buyer?.user_metadata?.firstName,
      lastName: buyer?.user_metadata?.lastName,
      email: buyer?.email,
    };

    res.status(201).json({
      success: true,
      order: createdOrder,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    let query = supabase.from('orders').select('*', { count: 'exact' });

    if (req.user!.role === 'organizer') {
      const { data: orgEvents } = await supabase
        .from('events')
        .select('id')
        .eq('organizer_id', req.user!.id);
      const eventIds = (orgEvents || []).map((e: any) => e.id);
      if (eventIds.length === 0) {
        return res.json({ success: true, orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
      }
      query = query.in('event_id', eventIds);
    } else {
      query = query.eq('buyer_id', req.user!.id);
    }

    if (status) query = query.eq('status', status as string);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: orders, error, count } = await query;

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const eventIds = [...new Set((orders || []).map((o: any) => o.event_id))];
    const buyerIds = [...new Set((orders || []).map((o: any) => o.buyer_id))];

    let eventsMap: Record<string, any> = {};
    if (eventIds.length > 0) {
      const { data: evts } = await supabase.from('events').select('id, title, start_date, end_date, venue, cover_image').in('id', eventIds);
      (evts || []).forEach((e: any) => { eventsMap[e.id] = e; });
    }

    let usersMap: Record<string, any> = {};
    if (buyerIds.length > 0) {
      const { data: allUsers } = await supabase.auth.admin.listUsers();
      (allUsers?.users || []).forEach((u: any) => {
        usersMap[u.id] = { firstName: u.user_metadata?.firstName, lastName: u.user_metadata?.lastName, email: u.email };
      });
    }

    const enriched = (orders || []).map((o: any) => {
      const transformed = transformOrder(o);
      transformed.event = eventsMap[o.event_id] || null;
      transformed.buyer = usersMap[o.buyer_id] || null;
      return transformed;
    });

    res.json({
      success: true,
      orders: enriched,
      pagination: { page: pageNum, limit: limitNum, total: count || 0, pages: Math.ceil((count || 0) / limitNum) },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', req.params.orderNumber)
      .single();

    if (error || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', order.event_id)
      .single();

    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const buyer = (allUsers?.users || []).find((u: any) => u.id === order.buyer_id);

    const orderResult = transformOrder(order);
    orderResult.event = event ? transformEvent(event) : null;
    orderResult.buyer = buyer
      ? { firstName: buyer.user_metadata?.firstName, lastName: buyer.user_metadata?.lastName, email: buyer.email }
      : null;

    res.json({
      success: true,
      order: orderResult,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const checkInAttendee = async (req: AuthRequest, res: Response) => {
  try {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', req.params.orderNumber)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', order.event_id)
      .single();

    if (event?.organizer_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.checked_in) {
      return res.status(400).json({ message: 'Already checked in' });
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', order.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ success: true, order: transformOrder(updated) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.buyer_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', order.event_id)
      .single();

    const settings = event?.settings || {};
    const refundPolicy = settings.refundPolicy || 'none';
    const allowRefund = refundPolicy !== 'none';

    if (allowRefund) {
      await supabase
        .from('orders')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_note: 'Cancelled by user',
        })
        .eq('id', req.params.id);
    } else {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', req.params.id);
    }

    if (event) {
      const updatedTiers = event.ticket_tiers.map((tier: any) => {
        const item = order.items.find((i: any) => i.ticketTierId === tier._id);
        if (item) {
          return { ...tier, quantitySold: Math.max(0, (tier.quantitySold || 0) - item.quantity) };
        }
        return tier;
      });

      const totalCancelled = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      await supabase
        .from('events')
        .update({
          ticket_tiers: updatedTiers,
          current_attendees: Math.max(0, (event.current_attendees || 0) - totalCancelled),
        })
        .eq('id', order.event_id);
    }

    const newStatus = allowRefund ? 'refunded' : 'cancelled';
    const updatedOrder = transformOrder({ ...order, status: newStatus });
    res.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const initiateRefund = async (req: AuthRequest, res: Response) => {
  try {
    const { refundAccountId, note } = req.body;

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', req.params.orderNumber)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'confirmed' && order.status !== 'pending') {
      return res.status(400).json({ message: `Order cannot be refunded in status: ${order.status}` });
    }

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', order.event_id)
      .single();

    if (event?.organizer_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to refund this order' });
    }

    if (refundAccountId) {
      const { data: account } = await supabase
        .from('payment_accounts')
        .select('id')
        .eq('id', refundAccountId)
        .single();

      if (!account) {
        return res.status(400).json({ message: 'Refund payment account not found' });
      }
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        refund_account_id: refundAccountId || null,
        refunded_at: new Date().toISOString(),
        refund_note: note || null,
      })
      .eq('id', order.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (event) {
      const updatedTiers = event.ticket_tiers.map((tier: any) => {
        const item = order.items.find((i: any) => i.ticketTierId === tier._id);
        if (item) {
          return { ...tier, quantitySold: Math.max(0, (tier.quantitySold || 0) - item.quantity) };
        }
        return tier;
      });

      const totalRefunded = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      await supabase
        .from('events')
        .update({
          ticket_tiers: updatedTiers,
          current_attendees: Math.max(0, (event.current_attendees || 0) - totalRefunded),
        })
        .eq('id', order.event_id);
    }

    res.json({ success: true, order: transformOrder(updated) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
