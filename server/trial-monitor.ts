import { storage } from './storage';
import { trialEmailService } from './trial';

/**
 * Background service to monitor trial statuses and send notifications
 * Runs periodically to check for trial warnings and expirations
 */
export class TrialMonitorService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  // Check every 4 hours in production, every 30 seconds in development
  private readonly checkInterval = process.env.NODE_ENV === 'production' ? 4 * 60 * 60 * 1000 : 30 * 1000;
  
  start() {
    if (this.isRunning) {
      console.log('Trial monitor already running');
      return;
    }
    
    console.log(`Starting trial monitor service (checking every ${this.checkInterval / 1000} seconds)`);
    this.isRunning = true;
    
    // Run immediately on start
    this.runTrialCheck().catch(console.error);
    
    // Then run periodically
    this.intervalId = setInterval(() => {
      this.runTrialCheck().catch(console.error);
    }, this.checkInterval);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Trial monitor service stopped');
  }
  
  private async runTrialCheck() {
    try {
      console.log('Running trial status check...');
      
      // Check for users needing trial warning emails
      await this.sendTrialWarningEmails();
      
      // Check for expired trials and update their status
      await this.updateExpiredTrials();
      
      console.log('Trial status check completed');
    } catch (error) {
      console.error('Error during trial check:', error);
    }
  }
  
  private async sendTrialWarningEmails() {
    try {
      const usersNeedingWarning = await storage.getUsersNeedingTrialWarning();
      
      if (usersNeedingWarning.length === 0) {
        console.log('No users need trial warning emails');
        return;
      }
      
      console.log(`Sending trial warning emails to ${usersNeedingWarning.length} users`);
      
      for (const user of usersNeedingWarning) {
        try {
          const emailSent = await trialEmailService.sendTrialWarningEmail(user);
          if (emailSent) {
            await storage.markTrialWarningEmailSent(user.id);
            console.log(`Trial warning email sent to ${user.email}`);
          } else {
            console.log(`Failed to send trial warning email to ${user.email}`);
          }
        } catch (error) {
          console.error(`Error sending trial warning to ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking users needing trial warnings:', error);
    }
  }
  
  private async updateExpiredTrials() {
    try {
      const expiredTrialUsers = await storage.getUsersWithExpiredTrials();
      
      if (expiredTrialUsers.length === 0) {
        console.log('No expired trials to update');
        return;
      }
      
      console.log(`Updating ${expiredTrialUsers.length} expired trials`);
      
      for (const user of expiredTrialUsers) {
        try {
          // Update account status to expired
          await storage.updateAccountStatus(user.id, 'expired');
          
          // Send expiration email
          await trialEmailService.sendTrialExpiredEmail(user);
          
          console.log(`Updated expired trial for user ${user.email}`);
        } catch (error) {
          console.error(`Error updating expired trial for ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error('Error updating expired trials:', error);
    }
  }
  
  // Manual trigger for testing
  async runManualCheck() {
    console.log('Running manual trial check...');
    await this.runTrialCheck();
  }
}

export const trialMonitor = new TrialMonitorService();