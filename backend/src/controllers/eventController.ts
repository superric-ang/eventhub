import { Response } from 'express';
import Event from '../models/Event';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    let body = req.body;

    if (body.data) {
      try {
        body = JSON.parse(body.data);
      } catch { /* use body as-is */ }
    }

    const parsedFields = ['ticketTiers', 'tags', 'settings', 'venue', 'onlineDetails'];
    for (const field of parsedFields) {
      if (typeof body[field] === 'string') {
        try { body[field] = JSON.parse(body[field]); } catch { /* keep string */ }
      }
    }

    const eventData = {
      ...body,
      organizer: req.user!._id,
    };

    if (req.file) {
      eventData.coverImage = `/uploads/${req.file.filename}`;
    }

    const event = await Event.create(eventData);
    res.status(201).json({ success: true, event });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1', limit = '12', category, format,
      search, city, dateFrom, dateTo, sort = '-startDate',
      organizer, status = 'published',
    } = req.query;

    const query: Record<string, any> = {};

    if (req.user?.role === 'organizer' && req.query.myEvents === 'true') {
      query.organizer = req.user._id;
      if (status) query.status = status;
    } else {
      query.status = 'published';
    }

    if (category) query.category = category;
    if (format) query.format = format;
    if (city) query['venue.city'] = new RegExp(city as string, 'i');
    if (organizer) query.organizer = organizer;

    if (search) {
      query.$text = { $search: search as string };
    }

    if (dateFrom || dateTo) {
      query.startDate = {};
      if (dateFrom) query.startDate.$gte = new Date(dateFrom as string);
      if (dateTo) query.startDate.$lte = new Date(dateTo as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName avatar organizationName')
      .sort(sort as string)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'firstName lastName avatar bio organizationName');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.updateOne({ _id: event._id }, { $inc: { views: 1 } });

    res.json({ success: true, event });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user!._id.toString() &&
        req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.file) {
      req.body.coverImage = `/uploads/${req.file.filename}`;
    }

    const updated = await Event.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );

    res.json({ success: true, event: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user!._id.toString() &&
        req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await event.deleteOne();
    res.json({ success: true, message: 'Event deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleSaveEvent = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const eventId = req.params.id;
    const index = user.savedEvents.indexOf(eventId as any);

    if (index > -1) {
      user.savedEvents.splice(index, 1);
    } else {
      user.savedEvents.push(eventId as any);
    }

    await user.save();
    res.json({ success: true, savedEvents: user.savedEvents });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (_req: AuthRequest, res: Response) => {
  const categories = [
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'food_drink', name: 'Food & Drink', icon: '🍽️' },
    { id: 'performing_arts', name: 'Performing Arts', icon: '🎭' },
    { id: 'visual_arts', name: 'Visual Arts', icon: '🎨' },
    { id: 'sports_fitness', name: 'Sports & Fitness', icon: '🏃' },
    { id: 'health_wellness', name: 'Health & Wellness', icon: '🧘' },
    { id: 'tech', name: 'Tech', icon: '💻' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'charity_causes', name: 'Charity & Causes', icon: '🤝' },
    { id: 'community', name: 'Community', icon: '🏘️' },
    { id: 'family_education', name: 'Family & Education', icon: '👨‍👩‍👧‍👦' },
    { id: 'fashion', name: 'Fashion', icon: '👗' },
    { id: 'film_media', name: 'Film & Media', icon: '🎬' },
    { id: 'travel_outdoor', name: 'Travel & Outdoor', icon: '🌍' },
    { id: 'nightlife', name: 'Nightlife', icon: '🌙' },
  ];
  res.json({ success: true, categories });
};
