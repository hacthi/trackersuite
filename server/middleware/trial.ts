import { Request, Response, NextFunction } from 'express';
import { validateTrialAccess, trialEmailService } from '../trial';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export interface TrialRequest extends AuthenticatedRequest {
  trialInfo?: {
    isValid: boolean;
    daysRemaining?: number;
    accountStatus: 'trial' | 'active' | 'expired' | 'cancelled';
    message?: string;
  };
}

/**
 * Middleware to check trial status and restrict access if trial has expired
 * Should be used after authentication middleware
 */
export const checkTrialStatus = async (req: TrialRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get full user data including trial information
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate trial access
    const trialValidation = validateTrialAccess(user);
    
    // Add trial info to request for use in routes
    req.trialInfo = trialValidation;

    // If access is not valid, return error
    if (!trialValidation.isValid) {
      // If trial expired, update account status
      if (user.accountStatus === 'trial' && trialValidation.accountStatus === 'expired') {
        await storage.updateAccountStatus(user.id, 'expired');
        // Send expiration email (fire and forget)
        trialEmailService.sendTrialExpiredEmail(user).catch(console.error);
      }
      
      return res.status(403).json({
        message: trialValidation.message,
        trialExpired: true,
        accountStatus: trialValidation.accountStatus
      });
    }

    // For valid trial users, check if we need to send warning email
    if (trialValidation.accountStatus === 'trial' && trialValidation.daysRemaining !== undefined) {
      if (trialValidation.daysRemaining <= 2 && !user.trialEmailSent) {
        // Send warning email (fire and forget)
        trialEmailService.sendTrialWarningEmail(user)
          .then(sent => {
            if (sent) {
              storage.markTrialWarningEmailSent(user.id).catch(console.error);
            }
          })
          .catch(console.error);
      }
    }

    next();
  } catch (error) {
    console.error('Trial status check error:', error);
    res.status(500).json({ message: 'Failed to verify trial status' });
  }
};

/**
 * Middleware to add trial information to response headers (for frontend)
 * Optional middleware that can be used to provide trial info without blocking access
 */
export const addTrialHeaders = async (req: TrialRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user && req.trialInfo) {
      res.setHeader('X-Trial-Status', req.trialInfo.accountStatus);
      if (req.trialInfo.daysRemaining !== undefined) {
        res.setHeader('X-Trial-Days-Remaining', req.trialInfo.daysRemaining.toString());
      }
      res.setHeader('X-Trial-Valid', req.trialInfo.isValid ? 'true' : 'false');
    }
    next();
  } catch (error) {
    console.error('Error adding trial headers:', error);
    next(); // Continue even if headers fail
  }
};

/**
 * Get trial info endpoint - doesn't require trial validation
 * Provides trial information for frontend display
 */
export const getTrialInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const trialValidation = validateTrialAccess(user);
    
    res.json({
      accountStatus: trialValidation.accountStatus,
      isTrialValid: trialValidation.isValid,
      daysRemaining: trialValidation.daysRemaining,
      trialEndsAt: user.trialEndsAt,
      message: trialValidation.message
    });
  } catch (error) {
    console.error('Get trial info error:', error);
    res.status(500).json({ message: 'Failed to get trial information' });
  }
};