import { pgTable, text, serial, integer, boolean, timestamp, varchar, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  status: text("status").notNull().default("prospect"), // prospect, active, inactive, lead, client, archived
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  tags: text("tags").array(),
  category: text("category"), // e.g., "Enterprise", "SMB", "Startup", "Agency"
  source: text("source"), // e.g., "Website", "Referral", "Cold Call", "LinkedIn"
  notes: text("notes"),
  lastContactDate: timestamp("last_contact_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_clients_user_id").on(table.userId),
  index("idx_clients_status").on(table.status),
  index("idx_clients_priority").on(table.priority),
  index("idx_clients_created_at").on(table.createdAt),
  index("idx_clients_email").on(table.email),
]);

export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, overdue
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_followups_user_id").on(table.userId),
  index("idx_followups_client_id").on(table.clientId),
  index("idx_followups_status").on(table.status),
  index("idx_followups_due_date").on(table.dueDate),
  index("idx_followups_priority").on(table.priority),
  index("idx_followups_created_at").on(table.createdAt),
]);

export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  type: text("type").notNull(), // call, email, meeting, note
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_interactions_user_id").on(table.userId),
  index("idx_interactions_client_id").on(table.clientId),
  index("idx_interactions_type").on(table.type),
  index("idx_interactions_created_at").on(table.createdAt),
]);

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFollowUpSchema = createInsertSchema(followUps).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type FollowUp = typeof followUps.$inferSelect;
export type InsertFollowUp = z.infer<typeof insertFollowUpSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;

// User authentication schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: text("role", { enum: ["individual", "corporate"] }).notNull().default("individual"),
  company: varchar("company", { length: 255 }), // Required for corporate users
  isActive: boolean("is_active").notNull().default(true),
  // User role and permissions
  userRole: text("user_role", { enum: ["user", "admin", "master_admin"] }).notNull().default("user"),
  permissions: text("permissions").array().notNull().default(["read_own", "write_own"]), // JSON array of permissions
  
  // Trial system fields
  accountStatus: text("account_status", { enum: ["trial", "active", "expired", "cancelled"] }).notNull().default("trial"),
  trialEndsAt: timestamp("trial_ends_at").notNull().defaultNow(), // Default to now, will be properly set during registration
  trialEmailSent: boolean("trial_email_sent").notNull().default(false), // Track if warning email was sent
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_users_email").on(table.email),
  index("idx_users_role").on(table.role),
  index("idx_users_is_active").on(table.isActive),
  index("idx_users_account_status").on(table.accountStatus),
  index("idx_users_trial_ends_at").on(table.trialEndsAt),
]);

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => [
  index("idx_sessions_expire").on(table.expire),
]);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  trialEndsAt: true, // Auto-generated during registration
  trialEmailSent: true, // Auto-set to false
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  followUps: many(followUps),
  interactions: many(interactions),
}));

export const clientsRelations = relations(clients, ({ many, one }) => ({
  followUps: many(followUps),
  interactions: many(interactions),
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  client: one(clients, {
    fields: [followUps.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [followUps.userId],
    references: [users.id],
  }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  client: one(clients, {
    fields: [interactions.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id],
  }),
}));

// Admin Notifications table
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
  data: text("data"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_admin_notifications_type").on(table.type),
  index("idx_admin_notifications_priority").on(table.priority),
  index("idx_admin_notifications_is_read").on(table.isRead),
  index("idx_admin_notifications_created_at").on(table.createdAt),
]);

// Webhook schema for API integrations
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: text("events").array().notNull(),
  secret: text("secret"),
  active: boolean("active").notNull().default(true),
  headers: text("headers"), // JSON string of headers
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_webhooks_user_id").on(table.userId),
  index("idx_webhooks_active").on(table.active),
]);

// Webhook deliveries for tracking webhook send attempts
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  webhookId: integer("webhook_id").references(() => webhooks.id).notNull(),
  event: text("event").notNull(),
  payload: text("payload").notNull(), // JSON string
  status: text("status", { enum: ["success", "failed", "pending"] }).notNull(),
  statusCode: integer("status_code"),
  response: text("response"),
  error: text("error"),
  attempts: integer("attempts").notNull().default(1),
  nextRetry: timestamp("next_retry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_webhook_deliveries_webhook_id").on(table.webhookId),
  index("idx_webhook_deliveries_status").on(table.status),
  index("idx_webhook_deliveries_created_at").on(table.createdAt),
]);

// Search history for improved UX
export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  query: text("query").notNull(),
  results: integer("results").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_search_history_user_id").on(table.userId),
  index("idx_search_history_created_at").on(table.createdAt),
]);

// Saved searches for power users
export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  query: text("query"),
  filters: text("filters"), // JSON string of search filters
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_saved_searches_user_id").on(table.userId),
]);

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type SavedSearch = typeof savedSearches.$inferSelect;

// Notification schema
export const insertAdminNotificationSchema = createInsertSchema(adminNotifications, {
  type: z.enum(["user_registration", "user_login", "role_change", "trial_expiring", "trial_expired", "admin_action", "system_alert"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
}).omit({
  id: true,
  createdAt: true,
});

// Export notification types
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;

// User Journey Milestones table
export const userJourneyMilestones = pgTable("user_journey_milestones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  milestoneType: text("milestone_type", { 
    enum: [
      "account_created", 
      "first_client_added", 
      "first_follow_up_scheduled", 
      "first_interaction_logged", 
      "five_clients_milestone", 
      "ten_follow_ups_milestone", 
      "first_export", 
      "trial_started", 
      "account_upgraded", 
      "profile_completed",
      "first_email_sent",
      "advanced_reporting_used",
      "twenty_clients_milestone",
      "fifty_interactions_milestone"
    ] 
  }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  points: integer("points").notNull().default(10), // Gamification points
  category: text("category", { enum: ["getting_started", "client_management", "engagement", "growth", "advanced"] }).notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_journey_milestones_user_id").on(table.userId),
  index("idx_journey_milestones_type").on(table.milestoneType),
  index("idx_journey_milestones_completed").on(table.isCompleted),
  index("idx_journey_milestones_category").on(table.category),
  // Unique constraint to prevent duplicate milestones per user
  uniqueIndex("unique_user_milestone").on(table.userId, table.milestoneType),
]);

// User Journey Progress table (overall progress tracking)
export const userJourneyProgress = pgTable("user_journey_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  totalPoints: integer("total_points").notNull().default(0),
  completedMilestones: integer("completed_milestones").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1),
  journeyStage: text("journey_stage", { 
    enum: ["onboarding", "exploring", "active", "power_user", "expert"] 
  }).notNull().default("onboarding"),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_journey_progress_user_id").on(table.userId),
  index("idx_journey_progress_stage").on(table.journeyStage),
  index("idx_journey_progress_level").on(table.currentLevel),
]);

// Journey milestone schemas
export const insertUserJourneyMilestoneSchema = createInsertSchema(userJourneyMilestones, {
  milestoneType: z.enum([
    "account_created", 
    "first_client_added", 
    "first_follow_up_scheduled", 
    "first_interaction_logged", 
    "five_clients_milestone", 
    "ten_follow_ups_milestone", 
    "first_export", 
    "trial_started", 
    "account_upgraded", 
    "profile_completed",
    "first_email_sent",
    "advanced_reporting_used",
    "twenty_clients_milestone",
    "fifty_interactions_milestone"
  ]),
  category: z.enum(["getting_started", "client_management", "engagement", "growth", "advanced"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  points: z.number().min(1).max(100),
}).omit({
  id: true,
  createdAt: true,
});

export const insertUserJourneyProgressSchema = createInsertSchema(userJourneyProgress, {
  journeyStage: z.enum(["onboarding", "exploring", "active", "power_user", "expert"]),
  totalPoints: z.number().min(0),
  completedMilestones: z.number().min(0),
  currentLevel: z.number().min(1),
}).omit({
  id: true,
  updatedAt: true,
});

// Relations for journey tracking
export const userJourneyMilestonesRelations = relations(userJourneyMilestones, ({ one }) => ({
  user: one(users, {
    fields: [userJourneyMilestones.userId],
    references: [users.id],
  }),
}));

export const userJourneyProgressRelations = relations(userJourneyProgress, ({ one }) => ({
  user: one(users, {
    fields: [userJourneyProgress.userId],
    references: [users.id],
  }),
}));

// Export journey types
export type UserJourneyMilestone = typeof userJourneyMilestones.$inferSelect;
export type InsertUserJourneyMilestone = z.infer<typeof insertUserJourneyMilestoneSchema>;
export type UserJourneyProgress = typeof userJourneyProgress.$inferSelect;
export type InsertUserJourneyProgress = z.infer<typeof insertUserJourneyProgressSchema>;
