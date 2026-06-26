import { Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';
import { transformKeys } from '../utils/transformers';

const COLOR_SCHEMES = [
  { id: 'eventhub-orange', name: 'EventHub Orange', primary: '#F6682F', primaryHover: '#E55A20', primaryLight: '#FFF0E8', dark: '#1E0A3C', bgGray: '#F8F7FA', borderGray: '#D4D5D9', textGray: '#6F7287', textDark: '#1E0A3C', success: '#0D9E5C', danger: '#E53E3E', fontFamily: 'Noto Sans', borderRadius: '8px' },
  { id: 'ocean-blue', name: 'Ocean Blue', primary: '#0066FF', primaryHover: '#0052CC', primaryLight: '#EBF5FF', dark: '#0A1628', bgGray: '#F5F8FC', borderGray: '#D0D9E6', textGray: '#5A6B87', textDark: '#0A1628', success: '#0D9E5C', danger: '#E53E3E', fontFamily: 'Inter', borderRadius: '8px' },
  { id: 'forest-green', name: 'Forest Green', primary: '#0E8345', primaryHover: '#0B6D3A', primaryLight: '#E8F5EE', dark: '#0A1C12', bgGray: '#F4F9F6', borderGray: '#C5D6CC', textGray: '#4D6B5A', textDark: '#0A1C12', success: '#0E8345', danger: '#D32F2F', fontFamily: 'Inter', borderRadius: '8px' },
  { id: 'royal-purple', name: 'Royal Purple', primary: '#7C3AED', primaryHover: '#6D28D9', primaryLight: '#F5F0FF', dark: '#1A0A2E', bgGray: '#F8F6FC', borderGray: '#D4C5E6', textGray: '#5F4B7A', textDark: '#1A0A2E', success: '#0D9E5C', danger: '#E53E3E', fontFamily: 'Inter', borderRadius: '8px' },
  { id: 'sunset-red', name: 'Sunset Red', primary: '#DC2626', primaryHover: '#B91C1C', primaryLight: '#FEF2F2', dark: '#1A0A0A', bgGray: '#FCF6F6', borderGray: '#E0C5C5', textGray: '#7A4B4B', textDark: '#1A0A0A', success: '#0D9E5C', danger: '#DC2626', fontFamily: 'Inter', borderRadius: '8px' },
  { id: 'midnight-black', name: 'Midnight Black', primary: '#1E1E2E', primaryHover: '#16161F', primaryLight: '#F0F0F5', dark: '#000000', bgGray: '#F5F5F7', borderGray: '#C5C5CC', textGray: '#6B6B78', textDark: '#000000', success: '#0D9E5C', danger: '#E53E3E', fontFamily: 'Inter', borderRadius: '8px' },
  { id: 'rose-pink', name: 'Rose Pink', primary: '#E91E63', primaryHover: '#C2185B', primaryLight: '#FCE4EC', dark: '#1A0A10', bgGray: '#FDF5F7', borderGray: '#E0C5CD', textGray: '#7A4B58', textDark: '#1A0A10', success: '#0D9E5C', danger: '#E91E63', fontFamily: 'Inter', borderRadius: '12px' },
  { id: 'amber-glow', name: 'Amber Glow', primary: '#F59E0B', primaryHover: '#D97706', primaryLight: '#FFFBEB', dark: '#1A1200', bgGray: '#FDF9F2', borderGray: '#E0D5C0', textGray: '#7A6B4B', textDark: '#1A1200', success: '#0D9E5C', danger: '#DC2626', fontFamily: 'Inter', borderRadius: '8px' },
  { id: 'teal-mint', name: 'Teal Mint', primary: '#0D9488', primaryHover: '#0F766E', primaryLight: '#EDFCF9', dark: '#061A17', bgGray: '#F4FAF9', borderGray: '#C0D6D2', textGray: '#4B6B66', textDark: '#061A17', success: '#0D9488', danger: '#E53E3E', fontFamily: 'Inter', borderRadius: '8px' },
  { id: 'slate-gray', name: 'Slate Gray', primary: '#475569', primaryHover: '#334155', primaryLight: '#F1F5F9', dark: '#0F172A', bgGray: '#F8FAFC', borderGray: '#CBD5E1', textGray: '#64748B', textDark: '#0F172A', success: '#0D9E5C', danger: '#E53E3E', fontFamily: 'Inter', borderRadius: '8px' },
  { id: 'cherry-blossom', name: 'Cherry Blossom', primary: '#FF6B9D', primaryHover: '#E85D8A', primaryLight: '#FFF0F5', dark: '#1A0A12', bgGray: '#FDF5F8', borderGray: '#E0C5D0', textGray: '#7A4B5E', textDark: '#1A0A12', success: '#0D9E5C', danger: '#E53E3E', fontFamily: 'Noto Sans', borderRadius: '12px' },
  { id: 'lime-fresh', name: 'Lime Fresh', primary: '#65A30D', primaryHover: '#4D7C0F', primaryLight: '#F0FCE0', dark: '#0A1400', bgGray: '#F7FBF2', borderGray: '#C5D6B0', textGray: '#4D6B33', textDark: '#0A1400', success: '#65A30D', danger: '#DC2626', fontFamily: 'Inter', borderRadius: '8px' },
];

export const getSiteSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*');

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const settings: Record<string, any> = {};
    (data || []).forEach((row: any) => {
      settings[row.key] = row.value;
    });

    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSiteSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ message: 'Key is required' });
    }

    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ success: true, setting: transformKeys(data) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    let users = (data?.users || []).map((u: any) => ({
      _id: u.id,
      email: u.email,
      firstName: u.user_metadata?.firstName || '',
      lastName: u.user_metadata?.lastName || '',
      role: u.app_metadata?.role || u.user_metadata?.role || 'attendee',
      avatar: u.user_metadata?.avatar || null,
      phone: u.user_metadata?.phone || null,
      organizationName: u.user_metadata?.organizationName || null,
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
      isConfirmed: u.email_confirmed_at ? true : false,
    }));

    if (search) {
      const q = (search as string).toLowerCase();
      users = users.filter((u: any) =>
        u.email?.toLowerCase().includes(q) ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q)
      );
    }

    const total = users.length;
    const start = (pageNum - 1) * limitNum;
    const paged = users.slice(start, start + limitNum);

    res.json({
      success: true,
      users: paged,
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

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(req.params.id);

    if (error || !data?.user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const u = data.user;
    const user = {
      _id: u.id,
      email: u.email,
      firstName: u.user_metadata?.firstName || '',
      lastName: u.user_metadata?.lastName || '',
      role: u.app_metadata?.role || u.user_metadata?.role || 'attendee',
      avatar: u.user_metadata?.avatar || null,
      phone: u.user_metadata?.phone || null,
      bio: u.user_metadata?.bio || null,
      organizationName: u.user_metadata?.organizationName || null,
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at,
      isConfirmed: u.email_confirmed_at ? true : false,
      userMetadata: u.user_metadata,
      appMetadata: u.app_metadata,
    };

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;

    if (!role || !['attendee', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be attendee, organizer, or admin' });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
      req.params.id,
      { app_metadata: { role } }
    );

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      success: true,
      user: {
        _id: data.user.id,
        email: data.user.email,
        role: data.user.app_metadata?.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const totalUsers = usersData?.users?.length || 0;

    const { data: eventsData } = await supabase
      .from('events')
      .select('status, category');

    const totalEvents = eventsData?.length || 0;
    const eventsByStatus: Record<string, number> = {};
    const eventsByCategory: Record<string, number> = {};
    (eventsData || []).forEach((e: any) => {
      eventsByStatus[e.status] = (eventsByStatus[e.status] || 0) + 1;
      eventsByCategory[e.category || 'other'] = (eventsByCategory[e.category || 'other'] || 0) + 1;
    });

    const { data: ordersData } = await supabase
      .from('orders')
      .select('status, grand_total');

    const totalOrders = ordersData?.length || 0;
    const ordersByStatus: Record<string, number> = {};
    let totalRevenue = 0;
    (ordersData || []).forEach((o: any) => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      if (o.status === 'confirmed') {
        totalRevenue += Number(o.grand_total) || 0;
      }
    });

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    let enrichedOrders: any[] = [];
    if (recentOrders && recentOrders.length > 0) {
      const eventIds = [...new Set(recentOrders.map((o: any) => o.event_id))];
      const { data: evts } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);
      const eventsMap: Record<string, any> = {};
      (evts || []).forEach((e: any) => { eventsMap[e.id] = e; });

      enrichedOrders = recentOrders.map((o: any) => ({
        ...transformKeys(o),
        eventTitle: eventsMap[o.event_id]?.title || null,
      }));
    }

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        eventsByStatus,
        totalOrders,
        ordersByStatus,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        eventsByCategory,
        recentOrders: enrichedOrders,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { type, periodStart, periodEnd } = req.body;

    if (!type || !['daily', 'monthly', 'annual', 'custom'].includes(type)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    const now = new Date();
    let startDate: string;
    let endDate: string;

    if (type === 'daily') {
      startDate = now.toISOString().slice(0, 10);
      endDate = startDate;
    } else if (type === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      endDate = now.toISOString().slice(0, 10);
    } else if (type === 'annual') {
      startDate = `${now.getFullYear()}-01-01`;
      endDate = now.toISOString().slice(0, 10);
    } else {
      startDate = periodStart;
      endDate = periodEnd;
    }

    const { data: usersData } = await supabase.auth.admin.listUsers();
    const totalUsers = usersData?.users?.length || 0;

    const cutOff = new Date(startDate);
    const newUsers = (usersData?.users || []).filter(
      (u: any) => new Date(u.created_at) >= cutOff
    ).length;

    const { data: events } = await supabase
      .from('events')
      .select('id, title, category, organizer_id, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59Z');

    const totalEventsCreated = events?.length || 0;
    const categoryCount: Record<string, number> = {};
    (events || []).forEach((e: any) => {
      categoryCount[e.category || 'other'] = (categoryCount[e.category || 'other'] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const orgCount: Record<string, number> = {};
    (events || []).forEach((e: any) => {
      orgCount[e.organizer_id] = (orgCount[e.organizer_id] || 0) + 1;
    });
    const topOrganizerIds = Object.entries(orgCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([id]) => id);

    let topOrganizers: any[] = [];
    if (topOrganizerIds.length > 0) {
      topOrganizers = topOrganizerIds.map((id) => {
        const u = (usersData?.users || []).find((u: any) => u.id === id);
        return {
          id,
          firstName: u?.user_metadata?.firstName || 'Unknown',
          lastName: u?.user_metadata?.lastName || 'User',
          eventCount: orgCount[id],
        };
      });
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59Z');

    const totalOrders = orders?.length || 0;
    let totalRevenue = 0;
    (orders || []).forEach((o: any) => {
      if (o.status === 'confirmed') {
        totalRevenue += Number(o.grand_total) || 0;
      }
    });

    const reportData = {
      periodStart: startDate,
      periodEnd: endDate,
      totalEventsCreated,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      newUsers,
      topCategories,
      topOrganizers,
    };

    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        type,
        period_start: startDate,
        period_end: endDate,
        data: reportData,
        generated_by: req.user!.id,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({ success: true, report: transformKeys(report) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getReports = async (_req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      success: true,
      reports: (data || []).map((r: any) => transformKeys(r)),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPayouts = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('payouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status as string);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const eventIds = [...new Set((data || []).map((p: any) => p.event_id))];
    const organizerIds = [...new Set((data || []).map((p: any) => p.organizer_id))];

    let eventsMap: Record<string, any> = {};
    if (eventIds.length > 0) {
      const { data: evts } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);
      (evts || []).forEach((e: any) => { eventsMap[e.id] = e; });
    }

    let usersMap: Record<string, any> = {};
    if (organizerIds.length > 0) {
      const { data: allUsers } = await supabase.auth.admin.listUsers();
      (allUsers?.users || []).forEach((u: any) => {
        usersMap[u.id] = {
          firstName: u.user_metadata?.firstName,
          lastName: u.user_metadata?.lastName,
          email: u.email,
        };
      });
    }

    const enriched = (data || []).map((p: any) => {
      const transformed = transformKeys(p);
      transformed.event = eventsMap[p.event_id] || null;
      transformed.organizer = usersMap[p.organizer_id] || null;
      return transformed;
    });

    res.json({ success: true, payouts: enriched });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approvePayout = async (req: AuthRequest, res: Response) => {
  try {
    const { data: payout, error: fetchError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({ message: `Payout is already ${payout.status}` });
    }

    const { data, error } = await supabase
      .from('payouts')
      .update({
        status: 'approved',
        approved_by: req.user!.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ success: true, payout: transformKeys(data) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markPayoutPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { data: payout, error: fetchError } = await supabase
      .from('payouts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }

    if (payout.status !== 'approved') {
      return res.status(400).json({ message: 'Payout must be approved before marking as paid' });
    }

    const { data, error } = await supabase
      .from('payouts')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ success: true, payout: transformKeys(data) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getColorSchemes = async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, colorSchemes: COLOR_SCHEMES });
};
