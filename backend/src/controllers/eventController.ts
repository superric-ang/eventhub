import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

interface QueryParams {
  page?: string;
  limit?: string;
  category?: string;
  format?: string;
  search?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  organizer?: string;
  status?: string;
  myEvents?: string;
}

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    let body = req.body;

    if (body.data) {
      try { body = JSON.parse(body.data); } catch { /* use as-is */ }
    }

    const parsedFields = ['ticketTiers', 'tags', 'settings', 'venue', 'onlineDetails'];
    for (const field of parsedFields) {
      if (typeof body[field] === 'string') {
        try { body[field] = JSON.parse(body[field]); } catch { /* keep string */ }
      }
    }

    const coverImage = req.file ? `/uploads/${req.file.filename}` : (body.coverImage || null);

    const eventData = {
      title: body.title,
      description: body.description || '',
      short_description: body.shortDescription || '',
      category: body.category || 'other',
      format: body.format || 'in_person',
      status: body.status || 'draft',
      organizer_id: req.user!.id,
      cover_image: coverImage,
      images: body.images || [],
      venue: body.venue || {},
      online_details: body.onlineDetails || {},
      start_date: body.startDate,
      end_date: body.endDate,
      timezone: body.timezone || 'Asia/Singapore',
      ticket_tiers: body.ticketTiers || [],
      tags: body.tags || [],
      is_private: body.isPrivate || false,
      max_attendees: body.maxAttendees || 0,
      settings: body.settings || {},
    };

    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({ success: true, event: data });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1', limit = '12', category, format,
      search, city, dateFrom, dateTo, sort = 'start_date',
      organizer, status = 'published',
    } = req.query as QueryParams;

    const isMyEvents = req.query.myEvents === 'true' && req.user?.role === 'organizer';

    let query = supabase.from('events').select('*', { count: 'exact' });

    if (isMyEvents && req.user) {
      query = query.eq('organizer_id', req.user.id);
      if (status) query = query.eq('status', status);
    } else {
      query = query.eq('status', 'published');
    }

    if (category) query = query.eq('category', category);
    if (format) query = query.eq('format', format);
    if (city) query = query.ilike('venue->>city', `%${city}%`);
    if (organizer) query = query.eq('organizer_id', organizer);

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    if (dateFrom) query = query.gte('start_date', dateFrom);
    if (dateTo) query = query.lte('start_date', dateTo);

    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOrder = sort.startsWith('-') ? { ascending: false } : { ascending: true };
    query = query.order(sortField, sortOrder);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data: events, error, count } = await query;

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const organizerIds = [...new Set(events?.map((e: any) => e.organizer_id) || [])];
    let organizerMap: Record<string, any> = {};
    if (organizerIds.length > 0) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const userMap: Record<string, any> = {};
      (users?.users || []).forEach((u: any) => {
        userMap[u.id] = {
          _id: u.id,
          firstName: u.user_metadata?.firstName,
          lastName: u.user_metadata?.lastName,
          avatar: u.user_metadata?.avatar,
          organizationName: u.user_metadata?.organizationName,
        };
      });
      organizerIds.forEach((id: string) => {
        organizerMap[id] = userMap[id] || { _id: id, firstName: 'Unknown', lastName: 'User' };
      });
    }

    const enriched = (events || []).map((e: any) => ({
      ...e,
      organizer: organizerMap[e.organizer_id] || { _id: e.organizer_id },
    }));

    res.json({
      success: true,
      events: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { data: eventUsers } = await supabase.auth.admin.listUsers();
    const organizerUser = (eventUsers?.users || []).find((u: any) => u.id === event.organizer_id);
    const organizer = organizerUser ? {
      _id: organizerUser.id,
      firstName: organizerUser.user_metadata?.firstName,
      lastName: organizerUser.user_metadata?.lastName,
      avatar: organizerUser.user_metadata?.avatar,
      bio: organizerUser.user_metadata?.bio,
      organizationName: organizerUser.user_metadata?.organizationName,
    } : { _id: event.organizer_id };

    await supabase.rpc('increment_event_views', { event_uuid: event.id });

    res.json({
      success: true,
      event: { ...event, organizer },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const coverImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updates: Record<string, any> = {};
    if (req.body.title) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.shortDescription !== undefined) updates.short_description = req.body.shortDescription;
    if (req.body.category) updates.category = req.body.category;
    if (req.body.format) updates.format = req.body.format;
    if (req.body.status) updates.status = req.body.status;
    if (coverImage) updates.cover_image = coverImage;
    if (req.body.startDate) updates.start_date = req.body.startDate;
    if (req.body.endDate) updates.end_date = req.body.endDate;
    if (req.body.venue) updates.venue = typeof req.body.venue === 'string' ? JSON.parse(req.body.venue) : req.body.venue;
    if (req.body.ticketTiers) updates.ticket_tiers = typeof req.body.ticketTiers === 'string' ? JSON.parse(req.body.ticketTiers) : req.body.ticketTiers;
    if (req.body.tags) updates.tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
    if (req.body.isPrivate !== undefined) updates.is_private = req.body.isPrivate;
    if (req.body.maxAttendees !== undefined) updates.max_attendees = req.body.maxAttendees;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const { data: updated, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ success: true, event: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ success: true, message: 'Event deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleSaveEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const userId = req.user!.id;

    const { data: existing } = await supabase
      .from('saved_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('saved_events')
        .delete()
        .eq('id', existing.id);
    } else {
      await supabase
        .from('saved_events')
        .insert({ user_id: userId, event_id: eventId });
    }

    const { data: savedEvents } = await supabase
      .from('saved_events')
      .select('event_id')
      .eq('user_id', userId);

    res.json({
      success: true,
      savedEvents: (savedEvents || []).map((s: any) => s.event_id),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (_req: AuthRequest, res: Response) => {
  const categories = [
    { id: 'music', name: 'Music', icon: '\uD83C\uDFB5' },
    { id: 'food_drink', name: 'Food & Drink', icon: '\uD83C\uDF7D\uFE0F' },
    { id: 'performing_arts', name: 'Performing Arts', icon: '\uD83C\uDFAD' },
    { id: 'visual_arts', name: 'Visual Arts', icon: '\uD83C\uDFA8' },
    { id: 'sports_fitness', name: 'Sports & Fitness', icon: '\uD83C\uDFC3' },
    { id: 'health_wellness', name: 'Health & Wellness', icon: '\uD83E\uDDD8' },
    { id: 'tech', name: 'Tech', icon: '\uD83D\uDCBB' },
    { id: 'business', name: 'Business', icon: '\uD83D\uDCBC' },
    { id: 'charity_causes', name: 'Charity & Causes', icon: '\uD83E\uDD1D' },
    { id: 'community', name: 'Community', icon: '\uD83C\uDFD8\uFE0F' },
    { id: 'family_education', name: 'Family & Education', icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC66' },
    { id: 'fashion', name: 'Fashion', icon: '\uD83D\uDC57' },
    { id: 'film_media', name: 'Film & Media', icon: '\uD83C\uDFAC' },
    { id: 'travel_outdoor', name: 'Travel & Outdoor', icon: '\uD83C\uDF0D' },
    { id: 'nightlife', name: 'Nightlife', icon: '\uD83C\uDF19' },
  ];
  res.json({ success: true, categories });
};
