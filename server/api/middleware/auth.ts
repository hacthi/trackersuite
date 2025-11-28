import { Request, Response, NextFunction } from 'express';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        userRole: string;
        permissions?: string[];
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated via session
  if (!req.session?.userId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this endpoint'
    });
  }

  // User data should be available from session
  // In a real implementation, you might want to fetch fresh user data
  req.user = {
    id: req.session.userId,
    email: req.session.userEmail || '',
    firstName: req.session.userFirstName || '',
    lastName: req.session.userLastName || '',
    userRole: req.session.userRole || 'user',
    permissions: req.session.userPermissions || []
  };

  next();
};