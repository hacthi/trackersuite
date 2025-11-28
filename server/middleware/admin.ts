import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface AdminRequest extends Request {
  user?: {
    id: number;
    email: string;
    userRole: 'user' | 'admin' | 'master_admin';
    permissions: string[];
  };
}

/**
 * Admin permission definitions
 */
export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users', 
  UPDATE_USERS: 'update_users',
  DELETE_USERS: 'delete_users',
  MANAGE_USER_ROLES: 'manage_user_roles',
  
  // Account management
  MODIFY_TRIALS: 'modify_trials',
  UPGRADE_ACCOUNTS: 'upgrade_accounts',
  VIEW_ALL_DATA: 'view_all_data',
  
  // System administration
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_LOGS: 'view_logs',
  
  // Standard user permissions
  READ_OWN: 'read_own',
  WRITE_OWN: 'write_own'
} as const;

/**
 * Role-based permission mapping
 */
export const ROLE_PERMISSIONS = {
  user: [PERMISSIONS.READ_OWN, PERMISSIONS.WRITE_OWN],
  admin: [
    PERMISSIONS.READ_OWN, 
    PERMISSIONS.WRITE_OWN,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.UPDATE_USERS,
    PERMISSIONS.MODIFY_TRIALS,
    PERMISSIONS.VIEW_ALL_DATA
  ],
  master_admin: [
    PERMISSIONS.READ_OWN,
    PERMISSIONS.WRITE_OWN, 
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.UPDATE_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.MANAGE_USER_ROLES,
    PERMISSIONS.MODIFY_TRIALS,
    PERMISSIONS.UPGRADE_ACCOUNTS,
    PERMISSIONS.VIEW_ALL_DATA,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_LOGS
  ]
} as const;

/**
 * Middleware to check if user has admin privileges
 */
export const requireAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.userRole !== 'admin' && user.userRole !== 'master_admin') {
      return res.status(403).json({ 
        message: 'Admin privileges required',
        requiredRole: 'admin'
      });
    }

    // Add role and permissions to request
    req.user.userRole = user.userRole;
    req.user.permissions = user.permissions || ROLE_PERMISSIONS[user.userRole];

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Failed to verify admin privileges' });
  }
};

/**
 * Middleware to check if user has master admin privileges
 */
export const requireMasterAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.userRole !== 'master_admin') {
      return res.status(403).json({ 
        message: 'Master admin privileges required',
        requiredRole: 'master_admin'
      });
    }

    // Add role and permissions to request
    req.user.userRole = user.userRole;
    req.user.permissions = user.permissions || ROLE_PERMISSIONS[user.userRole];

    next();
  } catch (error) {
    console.error('Master admin check error:', error);
    res.status(500).json({ message: 'Failed to verify master admin privileges' });
  }
};

/**
 * Check if user has specific permission
 */
export const requirePermission = (permission: string) => {
  return async (req: AdminRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userPermissions = user.permissions || ROLE_PERMISSIONS[user.userRole || 'user'];
      
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          requiredPermission: permission
        });
      }

      req.user.userRole = user.userRole;
      req.user.permissions = userPermissions;

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Failed to verify permissions' });
    }
  };
};

/**
 * Helper function to check if user can perform action on target user
 */
export const canManageUser = (adminRole: string, targetUserRole: string): boolean => {
  // Master admins can manage anyone
  if (adminRole === 'master_admin') return true;
  
  // Admins can manage regular users but not other admins
  if (adminRole === 'admin' && targetUserRole === 'user') return true;
  
  return false;
};