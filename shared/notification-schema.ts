import { pgTable, serial, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  type: text("type", { 
    enum: ["user_registration", "user_login", "role_change", "trial_expiring", "trial_expired", "admin_action", "system_alert"] 
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  userId: integer("user_id"),
  userName: text("user_name"),
  userEmail: text("user_email"),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  isRead: boolean("is_read").notNull().default(false),
  data: jsonb("data"), // Additional structured data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications, {
  type: z.enum(["user_registration", "user_login", "role_change", "trial_expiring", "trial_expired", "admin_action", "system_alert"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
}).omit({
  id: true,
  createdAt: true,
});

export const selectAdminNotificationSchema = createSelectSchema(adminNotifications);

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;