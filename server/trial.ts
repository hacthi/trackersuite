import { type User } from "@shared/schema";
import { MailService } from '@sendgrid/mail';

// Trial configuration
export const TRIAL_DURATION_DAYS = 7;
export const TRIAL_WARNING_DAYS = 2;

// Trial utility functions
export function calculateTrialEndDate(): Date {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);
  return endDate;
}

export function isTrialExpired(trialEndsAt: Date): boolean {
  return new Date() > trialEndsAt;
}

export function getTrialDaysRemaining(trialEndsAt: Date): number {
  const now = new Date();
  const timeDiff = trialEndsAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(0, daysRemaining);
}

export function shouldSendTrialWarningEmail(trialEndsAt: Date, emailSent: boolean): boolean {
  if (emailSent) return false;
  
  const daysRemaining = getTrialDaysRemaining(trialEndsAt);
  return daysRemaining <= TRIAL_WARNING_DAYS && daysRemaining > 0;
}

export function getAccountStatusFromTrial(trialEndsAt: Date): 'trial' | 'expired' {
  return isTrialExpired(trialEndsAt) ? 'expired' : 'trial';
}

// Trial validation middleware result interface
export interface TrialValidationResult {
  isValid: boolean;
  message?: string;
  daysRemaining?: number;
  accountStatus: 'trial' | 'active' | 'expired' | 'cancelled';
}

export function validateTrialAccess(user: User): TrialValidationResult {
  const { accountStatus, trialEndsAt } = user;
  
  // Allow access for active accounts
  if (accountStatus === 'active') {
    return {
      isValid: true,
      accountStatus: 'active'
    };
  }
  
  // Block access for cancelled accounts
  if (accountStatus === 'cancelled') {
    return {
      isValid: false,
      message: "Your account has been cancelled. Please contact support to reactivate.",
      accountStatus: 'cancelled'
    };
  }
  
  // Handle trial accounts
  if (accountStatus === 'trial') {
    const expired = isTrialExpired(trialEndsAt);
    const daysRemaining = getTrialDaysRemaining(trialEndsAt);
    
    if (expired) {
      return {
        isValid: false,
        message: "Your free trial has expired. Please upgrade your account to continue using Tracker Suite.",
        daysRemaining: 0,
        accountStatus: 'expired'
      };
    }
    
    return {
      isValid: true,
      daysRemaining,
      accountStatus: 'trial'
    };
  }
  
  // Handle already expired accounts
  if (accountStatus === 'expired') {
    return {
      isValid: false,
      message: "Your free trial has expired. Please upgrade your account to continue using Tracker Suite.",
      daysRemaining: 0,
      accountStatus: 'expired'
    };
  }
  
  // Fallback - shouldn't reach here
  return {
    isValid: false,
    message: "Account status is unclear. Please contact support.",
    accountStatus: accountStatus as any
  };
}

// Email service for trial notifications
export class TrialEmailService {
  private mailService?: MailService;
  
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      this.mailService = new MailService();
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }
  
  async sendTrialWarningEmail(user: User): Promise<boolean> {
    if (!this.mailService) {
      console.log('SendGrid API key not configured - skipping trial warning email');
      return false;
    }
    
    const daysRemaining = getTrialDaysRemaining(user.trialEndsAt);
    
    try {
      await this.mailService.send({
        to: user.email,
        from: process.env.FROM_EMAIL || 'noreply@trackersuite.com',
        subject: `Your Tracker Suite trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Your Trial is Ending Soon</h2>
            <p>Hi ${user.firstName},</p>
            <p>Your free trial of Tracker Suite will expire in <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong>.</p>
            <p>To continue managing your client relationships without interruption, please upgrade your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://app.trackersuite.com'}/upgrade" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Upgrade Now
              </a>
            </div>
            <p>Questions? Reply to this email and we'll be happy to help.</p>
            <p>Best regards,<br>The Tracker Suite Team</p>
          </div>
        `,
        text: `Hi ${user.firstName},

Your free trial of Tracker Suite will expire in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.

To continue managing your client relationships without interruption, please upgrade your account at: ${process.env.FRONTEND_URL || 'https://app.trackersuite.com'}/upgrade

Questions? Reply to this email and we'll be happy to help.

Best regards,
The Tracker Suite Team`
      });
      
      console.log(`Trial warning email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send trial warning email:', error);
      return false;
    }
  }
  
  async sendTrialExpiredEmail(user: User): Promise<boolean> {
    if (!this.mailService) {
      console.log('SendGrid API key not configured - skipping trial expired email');
      return false;
    }
    
    try {
      await this.mailService.send({
        to: user.email,
        from: process.env.FROM_EMAIL || 'noreply@trackersuite.com',
        subject: 'Your Tracker Suite trial has expired',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Your Trial Has Expired</h2>
            <p>Hi ${user.firstName},</p>
            <p>Your free trial of Tracker Suite has expired. To continue accessing your client data and using our powerful features, please upgrade your account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://app.trackersuite.com'}/upgrade" 
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Upgrade Now
              </a>
            </div>
            <p>Your data is safe and will be restored once you upgrade.</p>
            <p>Need help choosing a plan? Reply to this email and we'll assist you.</p>
            <p>Best regards,<br>The Tracker Suite Team</p>
          </div>
        `,
        text: `Hi ${user.firstName},

Your free trial of Tracker Suite has expired. To continue accessing your client data and using our powerful features, please upgrade your account at: ${process.env.FRONTEND_URL || 'https://app.trackersuite.com'}/upgrade

Your data is safe and will be restored once you upgrade.

Need help choosing a plan? Reply to this email and we'll assist you.

Best regards,
The Tracker Suite Team`
      });
      
      console.log(`Trial expired email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Failed to send trial expired email:', error);
      return false;
    }
  }
}

export const trialEmailService = new TrialEmailService();