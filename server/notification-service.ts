import { db } from "./db";
import { adminNotifications } from "@shared/schema";
import type { InsertAdminNotification } from "@shared/schema";

export class NotificationService {
  // Create a new admin notification
  static async createNotification(notification: InsertAdminNotification): Promise<void> {
    try {
      await db.insert(adminNotifications).values(notification);
      console.log(`[NotificationService] Created notification: ${notification.type} - ${notification.title}`);
    } catch (error) {
      console.error("[NotificationService] Error creating notification:", error);
    }
  }

  // User registration notification
  static async notifyUserRegistration(user: { id: number; firstName: string; lastName: string; email: string; role: string }): Promise<void> {
    await this.createNotification({
      type: "user_registration",
      title: "New User Registration",
      message: `${user.firstName} ${user.lastName} (${user.role}) has registered an account`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      priority: "medium",
      data: JSON.stringify({ userRole: user.role, registrationDate: new Date().toISOString() }),
    });
  }

  // User login notification (for tracking purposes)
  static async notifyUserLogin(user: { id: number; firstName: string; lastName: string; email: string; userRole: string }): Promise<void> {
    // Only notify for admin logins or first login of the day
    const isAdmin = user.userRole === "admin" || user.userRole === "master_admin";
    
    if (isAdmin) {
      await this.createNotification({
        type: "user_login",
        title: "Admin Login",
        message: `${user.firstName} ${user.lastName} (${user.userRole}) logged in`,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        priority: "low",
        data: JSON.stringify({ userRole: user.userRole, loginTime: new Date().toISOString() }),
      });
    }
  }

  // Role change notification
  static async notifyRoleChange(user: { id: number; firstName: string; lastName: string; email: string }, oldRole: string, newRole: string, changedBy: string): Promise<void> {
    await this.createNotification({
      type: "role_change",
      title: "User Role Changed",
      message: `${user.firstName} ${user.lastName}'s role changed from ${oldRole} to ${newRole} by ${changedBy}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      priority: "high",
      data: JSON.stringify({ oldRole, newRole, changedBy, changeTime: new Date().toISOString() }),
    });
  }

  // Trial expiring notification
  static async notifyTrialExpiring(user: { id: number; firstName: string; lastName: string; email: string }, daysLeft: number): Promise<void> {
    await this.createNotification({
      type: "trial_expiring",
      title: "Trial Expiring Soon",
      message: `${user.firstName} ${user.lastName}'s trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      priority: daysLeft <= 1 ? "critical" : daysLeft <= 3 ? "high" : "medium",
      data: JSON.stringify({ daysLeft, expirationAlert: true }),
    });
  }

  // Trial expired notification
  static async notifyTrialExpired(user: { id: number; firstName: string; lastName: string; email: string }): Promise<void> {
    await this.createNotification({
      type: "trial_expired",
      title: "Trial Expired",
      message: `${user.firstName} ${user.lastName}'s trial has expired`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      priority: "critical",
      data: JSON.stringify({ expired: true, expiredAt: new Date().toISOString() }),
    });
  }

  // Admin action notification
  static async notifyAdminAction(action: string, details: string, performedBy: string, targetUser?: { id: number; firstName: string; lastName: string; email: string }): Promise<void> {
    await this.createNotification({
      type: "admin_action",
      title: `Admin Action: ${action}`,
      message: `${details} performed by ${performedBy}`,
      userId: targetUser?.id,
      userName: targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : undefined,
      userEmail: targetUser?.email,
      priority: "medium",
      data: JSON.stringify({ action, performedBy, performedAt: new Date().toISOString() }),
    });
  }

  // System alert notification
  static async notifySystemAlert(title: string, message: string, priority: "low" | "medium" | "high" | "critical" = "medium"): Promise<void> {
    await this.createNotification({
      type: "system_alert",
      title,
      message,
      priority,
      data: JSON.stringify({ systemAlert: true, alertTime: new Date().toISOString() }),
    });
  }

  // Clean old notifications (keep last 100 per type or older than 30 days)
  static async cleanOldNotifications(): Promise<void> {
    try {
      // This would be implemented with more complex SQL to keep recent notifications
      // For now, we'll keep it simple and just log
      console.log("[NotificationService] Cleaning old notifications...");
    } catch (error) {
      console.error("[NotificationService] Error cleaning old notifications:", error);
    }
  }
}

export default NotificationService;