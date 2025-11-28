import { 
  clients, 
  followUps, 
  interactions, 
  users,
  webhooks,
  webhookDeliveries,
  searchHistory,
  savedSearches,
  type Client, 
  type InsertClient,
  type FollowUp,
  type InsertFollowUp,
  type Interaction,
  type InsertInteraction,
  type User, 
  type InsertUser,
  type Webhook,
  type InsertWebhook 
} from "@shared/schema";
import { db } from "./db";
import { eq, like, or, desc, and, gte, lte, sql, ilike, count } from "drizzle-orm";

export interface IStorage {
  // User authentication methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Trial management methods
  getUsersNeedingTrialWarning(): Promise<User[]>;
  getUsersWithExpiredTrials(): Promise<User[]>;
  markTrialWarningEmailSent(userId: number): Promise<void>;
  updateAccountStatus(userId: number, status: 'trial' | 'active' | 'expired' | 'cancelled'): Promise<User | undefined>;
  
  // Admin management methods
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: number, role: 'user' | 'admin' | 'master_admin'): Promise<User | undefined>;
  updateUserPermissions(userId: number, permissions: string[]): Promise<User | undefined>;
  deleteUser(userId: number): Promise<boolean>;
  createMasterAdmin(user: InsertUser): Promise<User>;
  
  // Client methods
  getClients(): Promise<Client[]>;
  getClientsByUser(userId: number): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient & { userId: number }): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  searchClients(query: string): Promise<Client[]>;
  searchClientsByUser(userId: number, query: string): Promise<Client[]>;
  
  // Follow-up methods
  getFollowUps(): Promise<FollowUp[]>;
  getFollowUpsByUser(userId: number): Promise<FollowUp[]>;
  getFollowUp(id: number): Promise<FollowUp | undefined>;
  getFollowUpsByClient(clientId: number): Promise<FollowUp[]>;
  createFollowUp(followUp: InsertFollowUp & { userId: number }): Promise<FollowUp>;
  updateFollowUp(id: number, followUp: Partial<InsertFollowUp>): Promise<FollowUp | undefined>;
  deleteFollowUp(id: number): Promise<boolean>;
  getUpcomingFollowUps(): Promise<FollowUp[]>;
  getUpcomingFollowUpsByUser(userId: number): Promise<FollowUp[]>;
  getOverdueFollowUps(): Promise<FollowUp[]>;
  getOverdueFollowUpsByUser(userId: number): Promise<FollowUp[]>;
  
  // Interaction methods
  getInteractions(): Promise<Interaction[]>;
  getInteractionsByUser(userId: number): Promise<Interaction[]>;
  getInteractionsByClient(clientId: number): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction & { userId: number }): Promise<Interaction>;
  
  // API-specific methods with pagination and filtering
  getClients(userId: number, options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<Client[]>;
  getClientCount(userId: number, options: { search?: string; status?: string; }): Promise<number>;
  getClient(id: number, userId: number): Promise<Client | undefined>;
  updateClient(id: number, userId: number, updates: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number, userId: number): Promise<boolean>;
  
  getFollowUps(userId: number, options: any): Promise<FollowUp[]>;
  getFollowUpCount(userId: number, options: any): Promise<number>;
  
  getInteractions(userId: number, options: any): Promise<Interaction[]>;
  getInteractionCount(userId: number, options: any): Promise<number>;
  
  // Search functionality
  universalSearch(userId: number, options: {
    query: string;
    type: string;
    limit: number;
    page: number;
    includeArchived: boolean;
  }): Promise<any[]>;
  advancedSearch(userId: number, filters: any): Promise<any>;
  getSearchSuggestions(userId: number, query: string): Promise<string[]>;
  getRecentSearches(userId: number): Promise<any[]>;
  saveSearch(userId: number, data: { name: string; query?: string; filters: any }): Promise<any>;
  getSavedSearches(userId: number): Promise<any[]>;
  
  // Webhook functionality  
  getWebhooks(userId: number): Promise<any[]>;
  createWebhook(data: any): Promise<any>;
  getWebhook(id: number, userId: number): Promise<any>;
  updateWebhook(id: number, userId: number, updates: any): Promise<any>;
  deleteWebhook(id: number, userId: number): Promise<boolean>;
  getActiveWebhooksForEvent(event: string): Promise<any[]>;
  logWebhookDelivery(data: any): Promise<any>;
  getWebhookDeliveries(webhookId: number, options: any): Promise<{ items: any[]; total: number }>;
  scheduleWebhookRetry(data: any): Promise<any>;
  getPendingWebhookRetries(): Promise<any[]>;
  removePendingRetry(id: number): Promise<boolean>;
  getWebhookById(id: number): Promise<any>;
  
  // Analytics functionality
  getDashboardAnalytics(userId: number, options: any): Promise<any>;
  getClientAnalytics(userId: number, options: any): Promise<any>;
  getPerformanceAnalytics(userId: number, options: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {

  // User authentication methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Calculate trial end date (7 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        trialEndsAt,
        accountStatus: 'trial',
        trialEmailSent: false
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Trial management methods
  async getUsersNeedingTrialWarning(): Promise<User[]> {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const result = await db.select().from(users).where(
      and(
        eq(users.accountStatus, 'trial'),
        eq(users.trialEmailSent, false),
        lte(users.trialEndsAt, threeDaysFromNow),
        gte(users.trialEndsAt, twoDaysFromNow)
      )
    );
    return result;
  }

  async getUsersWithExpiredTrials(): Promise<User[]> {
    const now = new Date();
    const result = await db.select().from(users).where(
      and(
        eq(users.accountStatus, 'trial'),
        lte(users.trialEndsAt, now)
      )
    );
    return result;
  }

  async markTrialWarningEmailSent(userId: number): Promise<void> {
    await db
      .update(users)
      .set({ trialEmailSent: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateAccountStatus(userId: number, status: 'trial' | 'active' | 'expired' | 'cancelled'): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ accountStatus: status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  // Admin management methods
  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users).orderBy(users.createdAt);
    return result;
  }

  async updateUserRole(userId: number, role: 'user' | 'admin' | 'master_admin'): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ userRole: role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserPermissions(userId: number, permissions: string[]): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ permissions, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async deleteUser(userId: number): Promise<boolean> {
    // Delete user's data first (cascade)
    await db.delete(interactions).where(eq(interactions.userId, userId));
    await db.delete(followUps).where(eq(followUps.userId, userId));
    await db.delete(clients).where(eq(clients.userId, userId));
    
    // Then delete the user
    const result = await db.delete(users).where(eq(users.id, userId));
    return result.rowCount != null && result.rowCount > 0;
  }

  async createMasterAdmin(insertUser: InsertUser): Promise<User> {
    // Calculate trial end date (master admins get longer trials or can be set to active)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 365); // 1 year for master admin
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        userRole: 'master_admin',
        accountStatus: 'active', // Master admin gets active account immediately
        trialEndsAt,
        trialEmailSent: false,
        permissions: ['read_own', 'write_own', 'view_users', 'create_users', 'update_users', 'delete_users', 'manage_user_roles', 'modify_trials', 'upgrade_accounts', 'view_all_data', 'system_settings', 'view_logs']
      })
      .returning();
    return user;
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    const result = await db.select().from(clients).orderBy(clients.updatedAt);
    return result.reverse();
  }

  async getClientsByUser(userId: number): Promise<Client[]> {
    const result = await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(clients.updatedAt);
    return result.reverse();
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient & { userId: number }): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: number, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: number): Promise<boolean> {
    // Delete related follow-ups and interactions first
    await db.delete(followUps).where(eq(followUps.clientId, id));
    await db.delete(interactions).where(eq(interactions.clientId, id));
    
    // Then delete the client
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount != null && result.rowCount > 0;
  }

  async searchClients(query: string): Promise<Client[]> {
    const result = await db.select().from(clients).where(
      or(
        like(clients.name, `%${query}%`),
        like(clients.email, `%${query}%`),
        like(clients.company, `%${query}%`)
      )
    );
    return result;
  }

  async searchClientsByUser(userId: number, query: string): Promise<Client[]> {
    // Make search case-insensitive by converting query to lowercase and using SQL LOWER function
    const lowerQuery = query.toLowerCase();
    const result = await db.select().from(clients).where(
      and(
        eq(clients.userId, userId),
        or(
          like(sql`LOWER(${clients.name})`, `%${lowerQuery}%`),
          like(sql`LOWER(${clients.email})`, `%${lowerQuery}%`),
          like(sql`LOWER(${clients.company})`, `%${lowerQuery}%`)
        )
      )
    );
    return result;
  }

  // Follow-up methods
  async getFollowUps(): Promise<FollowUp[]> {
    const result = await db.select().from(followUps).orderBy(followUps.dueDate);
    return result;
  }

  async getFollowUpsByUser(userId: number): Promise<FollowUp[]> {
    const result = await db.select({
      id: followUps.id,
      userId: followUps.userId,
      clientId: followUps.clientId,
      title: followUps.title,
      description: followUps.description,
      dueDate: followUps.dueDate,
      status: followUps.status,
      priority: followUps.priority,
      createdAt: followUps.createdAt,
      updatedAt: followUps.updatedAt,
      completedAt: followUps.completedAt,
    }).from(followUps)
      .where(eq(followUps.userId, userId))
      .orderBy(followUps.dueDate);
    return result;
  }

  async getFollowUp(id: number): Promise<FollowUp | undefined> {
    const [followUp] = await db.select().from(followUps).where(eq(followUps.id, id));
    return followUp || undefined;
  }

  async getFollowUpsByClient(clientId: number): Promise<FollowUp[]> {
    const result = await db.select().from(followUps)
      .where(eq(followUps.clientId, clientId))
      .orderBy(followUps.dueDate);
    return result;
  }

  async createFollowUp(insertFollowUp: InsertFollowUp & { userId: number }): Promise<FollowUp> {
    const [followUp] = await db
      .insert(followUps)
      .values(insertFollowUp)
      .returning();
    return followUp;
  }

  async updateFollowUp(id: number, updates: Partial<InsertFollowUp>): Promise<FollowUp | undefined> {
    const [followUp] = await db
      .update(followUps)
      .set({ 
        ...updates, 
        updatedAt: new Date(),
        completedAt: updates.status === 'completed' ? new Date() : undefined
      })
      .where(eq(followUps.id, id))
      .returning();
    return followUp || undefined;
  }

  async deleteFollowUp(id: number): Promise<boolean> {
    const result = await db.delete(followUps).where(eq(followUps.id, id));
    return result.rowCount != null && result.rowCount > 0;
  }

  async getUpcomingFollowUps(): Promise<FollowUp[]> {
    const now = new Date();
    const result = await db.select().from(followUps)
      .where(eq(followUps.status, 'pending'))
      .orderBy(followUps.dueDate);
    return result.filter(followUp => new Date(followUp.dueDate) >= now);
  }

  async getUpcomingFollowUpsByUser(userId: number): Promise<FollowUp[]> {
    const now = new Date();
    const result = await db.select({
      id: followUps.id,
      userId: followUps.userId,
      clientId: followUps.clientId,
      title: followUps.title,
      description: followUps.description,
      dueDate: followUps.dueDate,
      status: followUps.status,
      priority: followUps.priority,
      createdAt: followUps.createdAt,
      updatedAt: followUps.updatedAt,
      completedAt: followUps.completedAt,
    }).from(followUps)
      .where(and(
        eq(followUps.userId, userId),
        eq(followUps.status, 'pending')
      ))
      .orderBy(followUps.dueDate);
    return result.filter((followUp: any) => new Date(followUp.dueDate) >= now);
  }

  async getOverdueFollowUps(): Promise<FollowUp[]> {
    const now = new Date();
    const result = await db.select().from(followUps)
      .where(eq(followUps.status, 'pending'))
      .orderBy(followUps.dueDate);
    return result.filter(followUp => new Date(followUp.dueDate) < now);
  }

  async getOverdueFollowUpsByUser(userId: number): Promise<FollowUp[]> {
    const now = new Date();
    const result = await db.select({
      id: followUps.id,
      userId: followUps.userId,
      clientId: followUps.clientId,
      title: followUps.title,
      description: followUps.description,
      dueDate: followUps.dueDate,
      status: followUps.status,
      priority: followUps.priority,
      createdAt: followUps.createdAt,
      updatedAt: followUps.updatedAt,
      completedAt: followUps.completedAt,
    }).from(followUps)
      .where(and(
        eq(followUps.userId, userId),
        eq(followUps.status, 'pending')
      ))
      .orderBy(followUps.dueDate);
    return result.filter((followUp: any) => new Date(followUp.dueDate) < now);
  }

  // Interaction methods
  async getInteractions(): Promise<Interaction[]> {
    const result = await db.select().from(interactions).orderBy(interactions.createdAt);
    return result.reverse();
  }

  async getInteractionsByUser(userId: number): Promise<Interaction[]> {
    const result = await db.select({
      id: interactions.id,
      userId: interactions.userId,
      clientId: interactions.clientId,
      type: interactions.type,
      notes: interactions.notes,
      createdAt: interactions.createdAt,
    }).from(interactions)
      .innerJoin(clients, eq(interactions.clientId, clients.id))
      .where(eq(clients.userId, userId))
      .orderBy(interactions.createdAt);
    return result.reverse();
  }

  async getInteractionsByClient(clientId: number): Promise<Interaction[]> {
    const result = await db.select().from(interactions)
      .where(eq(interactions.clientId, clientId))
      .orderBy(interactions.createdAt);
    return result.reverse();
  }

  async createInteraction(insertInteraction: InsertInteraction & { userId: number }): Promise<Interaction> {
    const [interaction] = await db
      .insert(interactions)
      .values(insertInteraction)
      .returning();
    return interaction;
  }

  // Extended API methods
  async getClients(userId: number, options: {
    page?: number,
    limit?: number,
    search?: string,
    status?: string,
    sortBy?: string,
    sortOrder?: string
  } = {}): Promise<Client[]> {
    const { page = 1, limit = 20, search = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = options;
    let query = db.select().from(clients).where(eq(clients.userId, userId));
    
    if (search) {
      query = query.where(
        or(
          ilike(clients.name, `%${search}%`),
          ilike(clients.email, `%${search}%`),
          ilike(clients.company, `%${search}%`)
        )
      ) as any;
    }
    
    if (status && status !== 'all') {
      query = query.where(eq(clients.status, status)) as any;
    }
    
    // Apply sorting
    const sortField = sortBy === 'name' ? clients.name :
                     sortBy === 'email' ? clients.email :
                     sortBy === 'company' ? clients.company :
                     sortBy === 'updatedAt' ? clients.updatedAt :
                     clients.createdAt;
    
    query = query.orderBy(sortOrder === 'asc' ? sortField : desc(sortField)) as any;
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset) as any;
    
    return await query;
  }

  async getClientCount(userId: number, options: { search?: string; status?: string; } = {}): Promise<number> {
    const { search, status } = options;
    let query = db.select({ count: count() }).from(clients).where(eq(clients.userId, userId));
    
    if (search) {
      query = query.where(
        or(
          ilike(clients.name, `%${search}%`),
          ilike(clients.email, `%${search}%`),
          ilike(clients.company, `%${search}%`)
        )
      ) as any;
    }
    
    if (status && status !== 'all') {
      query = query.where(eq(clients.status, status)) as any;
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  async getClient(id: number, userId: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client || undefined;
  }

  async updateClient(id: number, userId: number, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return result.rowCount != null && result.rowCount > 0;
  }

  // Search functionality placeholders (simplified for now)
  async universalSearch(userId: number, options: any): Promise<any[]> {
    const clientResults = await this.getClients(userId, {
      search: options.query,
      limit: Math.min(options.limit, 20)
    });
    
    return [{
      type: 'clients',
      results: clientResults,
      total: clientResults.length
    }];
  }

  async advancedSearch(userId: number, filters: any): Promise<any> {
    return { results: [], total: 0 };
  }

  async getSearchSuggestions(userId: number, query: string): Promise<string[]> {
    return [];
  }

  async getRecentSearches(userId: number): Promise<any[]> {
    return [];
  }

  async saveSearch(userId: number, data: any): Promise<any> {
    return { id: 1, ...data };
  }

  async getSavedSearches(userId: number): Promise<any[]> {
    return [];
  }

  // Webhook functionality placeholders
  async getWebhooks(userId: number): Promise<any[]> {
    return [];
  }

  async createWebhook(data: any): Promise<any> {
    return { id: 1, ...data };
  }

  async getWebhook(id: number, userId: number): Promise<any> {
    return null;
  }

  async updateWebhook(id: number, userId: number, updates: any): Promise<any> {
    return null;
  }

  async deleteWebhook(id: number, userId: number): Promise<boolean> {
    return false;
  }

  async getActiveWebhooksForEvent(event: string): Promise<any[]> {
    return [];
  }

  async logWebhookDelivery(data: any): Promise<any> {
    return { id: 1, ...data };
  }

  async getWebhookDeliveries(webhookId: number, options: any): Promise<{ items: any[]; total: number }> {
    return { items: [], total: 0 };
  }

  async scheduleWebhookRetry(data: any): Promise<any> {
    return { id: 1, ...data };
  }

  async getPendingWebhookRetries(): Promise<any[]> {
    return [];
  }

  async removePendingRetry(id: number): Promise<boolean> {
    return true;
  }

  async getWebhookById(id: number): Promise<any> {
    return null;
  }

  // Analytics functionality placeholders
  async getDashboardAnalytics(userId: number, options: any): Promise<any> {
    const totalClients = await this.getClientCount(userId);
    const totalFollowUps = (await this.getFollowUpsByUser(userId)).length;
    const totalInteractions = (await this.getInteractionsByUser(userId)).length;
    
    return {
      totalClients,
      totalFollowUps,
      totalInteractions,
      completedFollowUps: 0,
      overdueFollowUps: 0
    };
  }

  async getClientAnalytics(userId: number, options: any): Promise<any> {
    return {
      clientGrowth: [],
      statusDistribution: [],
      topSources: []
    };
  }

  async getPerformanceAnalytics(userId: number, options: any): Promise<any> {
    return {
      followUpCompletion: [],
      responseTime: [],
      clientEngagement: []
    };
  }
}

export const storage = new DatabaseStorage();
