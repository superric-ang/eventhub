import { Request, Response } from 'express';
import supabase from '../lib/supabase';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, organizationName } = req.body;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        firstName,
        lastName,
        role: role || 'attendee',
        organizationName: organizationName || null,
      },
      app_metadata: {
        role: role || 'attendee',
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      return res.status(400).json({ message: error.message });
    }

    const user = data.user;
    if (!user) {
      return res.status(500).json({ message: 'Failed to create user' });
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const token = signInData?.session?.access_token || '';

    if (!token) {
      return res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.user_metadata?.firstName,
          lastName: user.user_metadata?.lastName,
          role: user.app_metadata?.role || 'attendee',
          organizationName: user.user_metadata?.organizationName || null,
        },
      });
    }

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        role: user.app_metadata?.role || 'attendee',
        organizationName: user.user_metadata?.organizationName || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const session = data.session;
    const user = data.user;

    if (!session || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: session.access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        role: user.app_metadata?.role || 'attendee',
        avatar: user.user_metadata?.avatar || null,
        organizationName: user.user_metadata?.organizationName || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.firstName,
        lastName: user.user_metadata?.lastName,
        role: user.role || 'attendee',
        avatar: user.user_metadata?.avatar || null,
        bio: user.user_metadata?.bio || null,
        location: user.user_metadata?.location || null,
        organizationName: user.user_metadata?.organizationName || null,
        phone: user.user_metadata?.phone || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, bio, location, organizationName, phone, avatar } = req.body;

    const updates: Record<string, any> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (organizationName !== undefined) updates.organizationName = organizationName;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    const { data, error } = await supabase.auth.admin.updateUserById(
      req.user!.id,
      { user_metadata: { ...req.user!.user_metadata, ...updates } }
    );

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const user = data.user;
    res.json({
      success: true,
      user: {
        id: user?.id,
        email: user?.email,
        firstName: user?.user_metadata?.firstName,
        lastName: user?.user_metadata?.lastName,
        role: user?.app_metadata?.role || 'attendee',
        avatar: user?.user_metadata?.avatar || null,
        bio: user?.user_metadata?.bio || null,
        location: user?.user_metadata?.location || null,
        organizationName: user?.user_metadata?.organizationName || null,
        phone: user?.user_metadata?.phone || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
