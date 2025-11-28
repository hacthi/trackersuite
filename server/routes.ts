import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { insertClientSchema, insertFollowUpSchema, insertInteractionSchema, loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";
import { authenticateToken, hashPassword, verifyPassword, type AuthenticatedRequest } from "./auth";
import { 
  cacheMiddleware, 
  generateCacheKey, 
  invalidateUserCache,
  clientCache,
  followUpCache,
  dashboardCache,
  statsCache
} from './middleware/cache';
import { 
  apiRateLimit, 
  strictRateLimit, 
  validateClientInput, 
  validateFollowUpInput, 
  validateInteractionInput,
  handleValidationErrors,
  xssProtection,
  sqlInjectionProtection,
  corsOptions
} from "./middleware/security";
import { checkTrialStatus, addTrialHeaders, getTrialInfo, type TrialRequest } from "./middleware/trial";
import { requireAdmin, requireMasterAdmin, requirePermission, canManageUser, PERMISSIONS, type AdminRequest } from "./middleware/admin";
import cors from 'cors';
import { sendEmail, renderEmailTemplate, emailTemplates } from "./resend";
import { NotificationService } from './notification-service';
import { JourneyService } from './journey-service';
import { adminNotifications, userJourneyMilestones, userJourneyProgress } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { db } from './db';

// Extend session data interface
declare module "express-session" {
  interface SessionData {
    userId?: number;
    userEmail?: string;
    userFirstName?: string;
    userLastName?: string;
    userRole?: string;
    userPermissions?: string[];
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply CORS first - permissive in development
  app.use(cors(corsOptions));
  
  // Apply additional security middleware only to API routes, not static assets
  if (process.env.NODE_ENV === 'production') {
    app.use('/api', apiRateLimit);
    app.use('/api', xssProtection);
    app.use('/api', sqlInjectionProtection);
  }

  // Configure session store using PostgreSQL with error handling
  const PostgresStore = pgSession(session);
  
  let sessionStore;
  try {
    sessionStore = new PostgresStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
      schemaName: 'public',
      errorLog: (error: Error) => {
        console.error('PostgreSQL session store error:', error);
      },
      ttl: 24 * 60 * 60, // 24 hours in seconds
      disableTouch: false,
      pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
    });
  } catch (error) {
    console.error('Failed to initialize PostgreSQL session store:', error);
    throw new Error('Session store initialization failed');
  }

  // Configure session middleware
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: true, // Create session for all requests
    store: sessionStore,
    cookie: {
      secure: false, // Allow cookies over HTTP in development and deployment
      httpOnly: false, // Allow JS access to debug cookie issues
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Allow cross-site requests for deployment
      path: '/',
    },
    name: 'connect.sid', // Explicit session name
    rolling: true, // Refresh session on each request
  }));

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Validate corporate users have company field
      if (validatedData.role === "corporate" && !validatedData.company) {
        return res.status(400).json({ message: "Company is required for corporate users" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const { confirmPassword, ...userData } = validatedData;
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;

      // Create notification for user registration
      await NotificationService.notifyUserRegistration({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      });

      // Initialize user journey
      await JourneyService.initializeUserJourney(user.id);

      // Return user without password
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Login request received:', req.body);
      console.log('Session before login:', req.session);
      
      const validatedData = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await verifyPassword(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive" });
      }

      // Regenerate session to ensure clean state
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regenerate error:", err);
          return res.status(500).json({ message: "Session regenerate failed" });
        }
        
        // Set session data
        req.session.userId = user.id;
        console.log('Session after regenerate and setting userId:', req.session);
        
        // Save session explicitly
        req.session.save(async (saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }
          
          console.log('Login successful, session saved for user:', user.email);
          console.log('Session ID:', req.sessionID);
          console.log('Final session data:', req.session);
          
          // Create notification for user login (only for admins)
          await NotificationService.notifyUserLogin({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userRole: user.userRole,
          });
          
          // Return user without password
          const { password, ...userResponse } = user;
          res.json(userResponse);
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Clear session endpoint to force browser to get new session
  app.post("/api/auth/clear-session", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Clear session error:", err);
        return res.status(500).json({ message: "Clear session failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Session cleared successfully" });
    });
  });

  app.get("/api/auth/me", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Trial information endpoint (no trial validation - just info)
  app.get("/api/auth/trial", authenticateToken, getTrialInfo);

  // Journey API endpoints
  app.get("/api/journey", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const journeyData = await JourneyService.getUserJourneyData(req.user!.id);
      res.json(journeyData);
    } catch (error) {
      console.error("Error fetching journey data:", error);
      res.status(500).json({ message: "Failed to fetch journey data" });
    }
  });

  app.post("/api/journey/milestone/:milestoneType", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const { milestoneType } = req.params;
      const completed = await JourneyService.checkAndCompleteMilestone(
        req.user!.id, 
        milestoneType as any
      );
      
      if (completed) {
        const journeyData = await JourneyService.getUserJourneyData(req.user!.id);
        res.json({ completed: true, journey: journeyData });
      } else {
        res.json({ completed: false });
      }
    } catch (error) {
      console.error("Error completing milestone:", error);
      res.status(500).json({ message: "Failed to complete milestone" });
    }
  });

  app.post("/api/journey/check-milestones", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const completedMilestones = await JourneyService.checkAllMilestones(req.user!.id);
      const journeyData = await JourneyService.getUserJourneyData(req.user!.id);
      res.json({ completedMilestones, journey: journeyData });
    } catch (error) {
      console.error("Error checking milestones:", error);
      res.status(500).json({ message: "Failed to check milestones" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", 
    authenticateToken, 
    requireAdmin, 
    async (req: AdminRequest, res) => {
      try {
        const users = await storage.getAllUsers();
        // Remove passwords from response
        const safeUsers = users.map(user => {
          const { password, ...safeUser } = user;
          return safeUser;
        });
        res.json(safeUsers);
      } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );

  app.put("/api/admin/users/:id/role", 
    authenticateToken, 
    requireMasterAdmin, 
    async (req: AdminRequest, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;

        if (!['user', 'admin', 'master_admin'].includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }

        // Prevent self-demotion for master admin
        if (req.user!.id === userId && role !== 'master_admin') {
          return res.status(400).json({ message: "Cannot demote yourself" });
        }

        // Get the old role before updating
        const existingUser = await storage.getUser(userId);
        const oldRole = existingUser?.userRole || 'user';

        const updatedUser = await storage.updateUserRole(userId, role);
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Create notification for role change
        await NotificationService.notifyRoleChange(
          {
            id: updatedUser.id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
          },
          oldRole,
          role,
          `${req.user!.firstName} ${req.user!.lastName}`
        );

        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
      } catch (error) {
        console.error("Update user role error:", error);
        res.status(500).json({ message: "Failed to update user role" });
      }
    }
  );

  app.delete("/api/admin/users/:id", 
    authenticateToken, 
    requireMasterAdmin, 
    async (req: AdminRequest, res) => {
      try {
        const userId = parseInt(req.params.id);

        // Prevent self-deletion
        if (req.user!.id === userId) {
          return res.status(400).json({ message: "Cannot delete your own account" });
        }

        const success = await storage.deleteUser(userId);
        if (!success) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ message: "Failed to delete user" });
      }
    }
  );

  app.put("/api/admin/users/:id/trial", 
    authenticateToken, 
    requireAdmin, 
    async (req: AdminRequest, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { accountStatus, trialDays } = req.body;

        if (!['trial', 'active', 'expired', 'cancelled'].includes(accountStatus)) {
          return res.status(400).json({ message: "Invalid account status" });
        }

        // Update account status
        let updatedUser = await storage.updateAccountStatus(userId, accountStatus);
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // If extending trial, update trial end date
        if (accountStatus === 'trial' && trialDays) {
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + parseInt(trialDays));
          
          updatedUser = await storage.updateUser(userId, { trialEndsAt });
        }

        const { password, ...safeUser } = updatedUser!;
        res.json(safeUser);
      } catch (error) {
        console.error("Update user trial error:", error);
        res.status(500).json({ message: "Failed to update user trial" });
      }
    }
  );

  // Update user profile endpoint (admin only)
  app.put("/api/admin/users/:id",
    authenticateToken,
    requireAdmin,
    async (req: AdminRequest, res) => {
      try {
        const userId = parseInt(req.params.id);
        const updateData = req.body;

        // Hash password if provided
        if (updateData.password && updateData.password.length > 0) {
          updateData.password = await hashPassword(updateData.password);
        } else {
          delete updateData.password;
        }

        const updatedUser = await storage.updateUser(userId, updateData);
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
      } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  );

  // Create master admin endpoint (only accessible by existing master admin)
  app.post("/api/admin/create-master", 
    authenticateToken, 
    requireMasterAdmin, 
    async (req: AdminRequest, res) => {
      try {
        const validatedData = registerSchema.parse(req.body);
        
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await hashPassword(validatedData.password);
        
        const masterAdmin = await storage.createMasterAdmin({
          ...validatedData,
          password: hashedPassword,
        });

        const { password, ...safeUser } = masterAdmin;
        res.status(201).json(safeUser);
      } catch (error) {
        console.error("Create master admin error:", error);
        res.status(500).json({ message: "Failed to create master admin" });
      }
    }
  );

  app.put("/api/auth/profile", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const { firstName, lastName, email, role, company } = req.body;
      
      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(409).json({ message: "Email already in use" });
      }

      const updatedUser = await storage.updateUser(req.user!.id, {
        firstName,
        lastName,
        email,
        role,
        company: role === "corporate" ? company : null,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/auth/password", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      const updatedUser = await storage.updateUser(req.user!.id, {
        password: hashedNewPassword,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  // Client routes (require authentication and valid trial)
  app.get("/api/clients", 
    authenticateToken,
    checkTrialStatus,
    addTrialHeaders,
    cacheMiddleware(clientCache, (req: AuthenticatedRequest) => 
      generateCacheKey('clients', req.user!.id)
    ), 
    async (req: TrialRequest, res) => {
      try {
        const clients = await storage.getClientsByUser(req.user!.id);
        res.json(clients);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch clients" });
      }
    }
  );

  app.get("/api/clients/search", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const clients = await storage.searchClientsByUser(req.user!.id, query);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to search clients" });
    }
  });

  app.get("/api/clients/:id", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      // Ensure client belongs to the authenticated user
      if (client.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient({
        ...validatedData,
        userId: req.user!.id,
      });
      
      // Invalidate user cache after creating client
      invalidateUserCache(req.user!.id);
      
      // Check and complete milestones after creating client
      await JourneyService.checkAndCompleteMilestone(req.user!.id, 'first_client_added');
      await JourneyService.checkAndCompleteMilestone(req.user!.id, 'five_clients_milestone');
      await JourneyService.checkAndCompleteMilestone(req.user!.id, 'twenty_clients_milestone');
      
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      // Ensure client belongs to the authenticated user
      if (client.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const validatedData = insertClientSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(id, validatedData);
      
      // Invalidate user cache after updating client
      invalidateUserCache(req.user!.id);
      
      res.json(updatedClient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      // Ensure client belongs to the authenticated user
      if (client.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const deleted = await storage.deleteClient(id);
      
      // Invalidate user cache after deleting client
      invalidateUserCache(req.user!.id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Follow-up routes (require authentication and valid trial)
  app.get("/api/follow-ups", 
    authenticateToken,
    checkTrialStatus,
    addTrialHeaders,
    cacheMiddleware(followUpCache, (req: AuthenticatedRequest) => 
      generateCacheKey('followups', req.user!.id)
    ), 
    async (req: TrialRequest, res) => {
      try {
        const followUps = await storage.getFollowUpsByUser(req.user!.id);
        res.json(followUps);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch follow-ups" });
      }
    }
  );

  app.get("/api/follow-ups/upcoming", 
    authenticateToken, 
    cacheMiddleware(followUpCache, (req: AuthenticatedRequest) => 
      generateCacheKey('followups:upcoming', req.user!.id), 180
    ), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const followUps = await storage.getUpcomingFollowUpsByUser(req.user!.id);
        res.json(followUps);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch upcoming follow-ups" });
      }
    }
  );

  app.get("/api/follow-ups/overdue", 
    authenticateToken, 
    cacheMiddleware(followUpCache, (req: AuthenticatedRequest) => 
      generateCacheKey('followups:overdue', req.user!.id), 180
    ), 
    async (req: AuthenticatedRequest, res) => {
      try {
        const followUps = await storage.getOverdueFollowUpsByUser(req.user!.id);
        res.json(followUps);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch overdue follow-ups" });
      }
    }
  );

  app.get("/api/follow-ups/client/:clientId", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      // Verify client belongs to user
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== req.user!.id) {
        return res.status(404).json({ message: "Client not found" });
      }
      const followUps = await storage.getFollowUpsByClient(clientId);
      res.json(followUps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client follow-ups" });
    }
  });

  app.post("/api/follow-ups", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const validatedData = insertFollowUpSchema.parse(req.body);
      // Verify client belongs to user
      const client = await storage.getClient(validatedData.clientId);
      if (!client || client.userId !== req.user!.id) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Ensure dueDate is a Date object
      const followUpData = {
        ...validatedData,
        dueDate: new Date(validatedData.dueDate),
        userId: req.user!.id,
      };
      
      const followUp = await storage.createFollowUp(followUpData);
      
      // Invalidate user cache after creating follow-up
      invalidateUserCache(req.user!.id);
      
      // Check and complete milestones after creating follow-up
      await JourneyService.checkAndCompleteMilestone(req.user!.id, 'first_follow_up_scheduled');
      await JourneyService.checkAndCompleteMilestone(req.user!.id, 'ten_follow_ups_milestone');
      
      res.status(201).json(followUp);
    } catch (error) {
      console.error("Failed to create follow-up:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid follow-up data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create follow-up" });
    }
  });

  app.put("/api/follow-ups/:id", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const followUp = await storage.getFollowUp(id);
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      // Verify client belongs to user
      const client = await storage.getClient(followUp.clientId);
      if (!client || client.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const validatedData = insertFollowUpSchema.partial().parse(req.body);
      const updatedFollowUp = await storage.updateFollowUp(id, validatedData);
      
      // Invalidate user cache after updating follow-up
      invalidateUserCache(req.user!.id);
      
      res.json(updatedFollowUp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid follow-up data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update follow-up" });
    }
  });

  app.delete("/api/follow-ups/:id", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const followUp = await storage.getFollowUp(id);
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      // Verify client belongs to user
      const client = await storage.getClient(followUp.clientId);
      if (!client || client.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const deleted = await storage.deleteFollowUp(id);
      
      // Invalidate user cache after deleting follow-up
      invalidateUserCache(req.user!.id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete follow-up" });
    }
  });

  // Interaction routes (require authentication)
  app.get("/api/interactions", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const interactions = await storage.getInteractionsByUser(req.user!.id);
      res.json(interactions);
    } catch (error) {
      console.error("Failed to fetch interactions:", error);
      res.status(500).json({ message: "Failed to fetch interactions" });
    }
  });

  app.get("/api/interactions/client/:clientId", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      // Verify client belongs to user
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== req.user!.id) {
        return res.status(404).json({ message: "Client not found" });
      }
      const interactions = await storage.getInteractionsByClient(clientId);
      res.json(interactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client interactions" });
    }
  });

  app.post("/api/interactions", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      // Verify client belongs to user
      const client = await storage.getClient(validatedData.clientId);
      if (!client || client.userId !== req.user!.id) {
        return res.status(404).json({ message: "Client not found" });
      }
      const interaction = await storage.createInteraction({
        ...validatedData,
        userId: req.user!.id,
      });
      
      // Invalidate user cache after creating interaction
      invalidateUserCache(req.user!.id);
      
      // Check and complete milestones after creating interaction
      await JourneyService.checkAndCompleteMilestone(req.user!.id, 'first_interaction_logged');
      await JourneyService.checkAndCompleteMilestone(req.user!.id, 'fifty_interactions_milestone');
      
      res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create interaction" });
    }
  });

  // Dashboard stats (require authentication)
  app.get("/api/dashboard/stats", 
    authenticateToken, 
    cacheMiddleware(dashboardCache, (req: AuthenticatedRequest) => 
      generateCacheKey('dashboard:stats', req.user!.id), 300
    ), 
    async (req: AuthenticatedRequest, res) => {
    try {
      const clients = await storage.getClientsByUser(req.user!.id);
      const followUps = await storage.getFollowUpsByUser(req.user!.id);
      const overdue = await storage.getOverdueFollowUpsByUser(req.user!.id);
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const completedThisWeek = followUps.filter(f => 
        f.status === 'completed' && 
        f.completedAt && 
        new Date(f.completedAt) >= weekAgo
      ).length;
      
      const newThisMonth = clients.filter(c => 
        new Date(c.createdAt) >= monthAgo
      ).length;
      
      const stats = {
        totalClients: clients.length,
        pendingFollowups: followUps.filter(f => f.status === 'pending').length,
        completedThisWeek,
        newThisMonth,
        overdueFollowups: overdue.length
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/overview", 
    authenticateToken, 
    cacheMiddleware(statsCache, (req: AuthenticatedRequest) => 
      generateCacheKey('analytics:overview', req.user!.id), 900
    ), 
    async (req: AuthenticatedRequest, res) => {
    try {
      const clients = await storage.getClientsByUser(req.user!.id);
      const followUps = await storage.getFollowUpsByUser(req.user!.id);
      const interactions = await storage.getInteractionsByUser(req.user!.id);

      const analytics = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'active').length,
        totalInteractions: interactions.length,
        totalFollowUps: followUps.length,
        completedFollowUps: followUps.filter(f => f.status === 'completed').length,
        overdueFollowUps: followUps.filter(f => f.status === 'overdue').length,
        clientsByStatus: clients.reduce((acc, client) => {
          acc[client.status] = (acc[client.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        clientsByPriority: clients.reduce((acc, client) => {
          acc[client.priority] = (acc[client.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentActivity: {
          clients: clients.slice(-10),
          followUps: followUps.slice(-10),
          interactions: interactions.slice(-10)
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Email communication routes (require authentication)
  app.post("/api/clients/:clientId/send-email", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const { subject, message, template, fromEmail, fromName } = req.body;

      // Verify client belongs to user
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== req.user!.id) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (!client.email) {
        return res.status(400).json({ message: "Client has no email address" });
      }

      let emailSubject = subject;
      let emailHtml = message;

      // Use template if specified
      if (template && Object.keys(emailTemplates).includes(template)) {
        const user = await storage.getUser(req.user!.id);
        const templateData = renderEmailTemplate(template as keyof typeof emailTemplates, {
          clientName: client.name,
          senderName: fromName || `${user?.firstName} ${user?.lastName}` || 'Support Team',
          message: message || '',
          topic: subject || '',
          projectName: subject || 'Your Project'
        });
        emailSubject = templateData.subject;
        emailHtml = templateData.html;
      }

      // Send email using MailerSend
      const result = await sendEmail({
        to: client.email,
        toName: client.name,
        from: fromEmail || 'noreply@yourcompany.com', // You should configure a proper from email
        fromName: fromName || 'Support Team',
        subject: emailSubject,
        html: emailHtml,
      });

      if (result.success) {
        // Log the email as an interaction
        await storage.createInteraction({
          clientId,
          userId: req.user!.id,
          type: 'email',
          notes: `Email sent: ${emailSubject}`,
          date: new Date(),
        });

        // Invalidate user cache
        invalidateUserCache(req.user!.id);

        res.status(200).json({ 
          message: 'Email sent successfully', 
          messageId: result.messageId 
        });
      } else {
        res.status(500).json({ 
          message: 'Failed to send email', 
          error: result.error 
        });
      }
    } catch (error) {
      console.error('Email sending error:', error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // Get available email templates
  app.get("/api/email/templates", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const templates = Object.keys(emailTemplates).map(key => ({
        id: key,
        name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        subject: emailTemplates[key as keyof typeof emailTemplates].subject
      }));
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  // Export routes (require authentication)
  app.get("/api/export/clients", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const clients = await storage.getClientsByUser(req.user!.id);
      const format = req.query.format as string || 'csv';
      
      if (format === 'csv') {
        const csvData = clients.map(client => ({
          Name: client.name,
          Email: client.email,
          Phone: client.phone || '',
          Company: client.company || '',
          Status: client.status,
          'Created At': client.createdAt,
          'Updated At': client.updatedAt,
          Notes: client.notes || ''
        }));
        
        const csvHeaders = Object.keys(csvData[0] || {});
        const csvRows = csvData.map(row => 
          csvHeaders.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
        );
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="clients.csv"');
        res.send(csvContent);
      } else {
        res.json(clients);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export clients" });
    }
  });

  app.get("/api/export/follow-ups", authenticateToken, checkTrialStatus, async (req: TrialRequest, res) => {
    try {
      const followUps = await storage.getFollowUpsByUser(req.user!.id);
      const clients = await storage.getClientsByUser(req.user!.id);
      const clientMap = new Map(clients.map(c => [c.id, c]));
      
      const format = req.query.format as string || 'csv';
      
      if (format === 'csv') {
        const csvData = followUps.map(followUp => ({
          Title: followUp.title,
          Client: clientMap.get(followUp.clientId)?.name || 'Unknown',
          'Due Date': followUp.dueDate,
          Status: followUp.status,
          'Created At': followUp.createdAt,
          'Completed At': followUp.completedAt || '',
          Description: followUp.description || ''
        }));
        
        const csvHeaders = Object.keys(csvData[0] || {});
        const csvRows = csvData.map(row => 
          csvHeaders.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
        );
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="follow-ups.csv"');
        res.send(csvContent);
      } else {
        res.json(followUps);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export follow-ups" });
    }
  });

  // Admin notification routes
  app.get("/api/admin/notifications", 
    authenticateToken, 
    requireAdmin, 
    async (req: AdminRequest, res) => {
      try {
        const notifications = await db.select()
          .from(adminNotifications)
          .orderBy(desc(adminNotifications.createdAt))
          .limit(50);
        res.json(notifications);
      } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
      }
    }
  );

  app.patch("/api/admin/notifications/:id/read", 
    authenticateToken, 
    requireAdmin, 
    async (req: AdminRequest, res) => {
      try {
        const notificationId = parseInt(req.params.id);
        await db.update(adminNotifications)
          .set({ isRead: true })
          .where(eq(adminNotifications.id, notificationId));
        res.json({ message: "Notification marked as read" });
      } catch (error) {
        console.error("Mark notification as read error:", error);
        res.status(500).json({ message: "Failed to mark notification as read" });
      }
    }
  );

  app.patch("/api/admin/notifications/read-all", 
    authenticateToken, 
    requireAdmin, 
    async (req: AdminRequest, res) => {
      try {
        await db.update(adminNotifications)
          .set({ isRead: true })
          .where(eq(adminNotifications.isRead, false));
        res.json({ message: "All notifications marked as read" });
      } catch (error) {
        console.error("Mark all notifications as read error:", error);
        res.status(500).json({ message: "Failed to mark all notifications as read" });
      }
    }
  );

  app.delete("/api/admin/notifications/:id", 
    authenticateToken, 
    requireAdmin, 
    async (req: AdminRequest, res) => {
      try {
        const notificationId = parseInt(req.params.id);
        await db.delete(adminNotifications)
          .where(eq(adminNotifications.id, notificationId));
        res.json({ message: "Notification deleted" });
      } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({ message: "Failed to delete notification" });
      }
    }
  );

  // Add API v1 routes
  const { apiV1Router } = await import('./api/v1/index');
  app.use('/api/v1', apiV1Router);

  const httpServer = createServer(app);
  return httpServer;
}
