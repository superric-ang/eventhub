import { Request, Response, NextFunction } from 'express';
import supabase from '../lib/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    user_metadata: Record<string, any>;
    app_metadata: Record<string, any>;
    role?: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }

    const user = data.user;
    const role = user.app_metadata?.role || user.user_metadata?.role || 'attendee';

    req.user = {
      id: user.id,
      email: user.email || '',
      user_metadata: user.user_metadata || {},
      app_metadata: user.app_metadata || {},
      role,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role || '')) {
      return res.status(403).json({
        message: `Role ${req.user?.role} is not authorized`,
      });
    }
    next();
  };
};
