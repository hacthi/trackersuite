var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import session from "express-session";
import pgSession from "connect-pg-simple";

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  clients: () => clients,
  clientsRelations: () => clientsRelations,
  followUps: () => followUps,
  followUpsRelations: () => followUpsRelations,
  insertClientSchema: () => insertClientSchema,
  insertFollowUpSchema: () => insertFollowUpSchema,
  insertInteractionSchema: () => insertInteractionSchema,
  insertUserSchema: () => insertUserSchema,
  interactions: () => interactions,
  interactionsRelations: () => interactionsRelations,
  loginSchema: () => loginSchema,
  registerSchema: () => registerSchema,
  sessions: () => sessions,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, serial, integer, boolean, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  status: text("status").notNull().default("prospect"),
  // prospect, active, inactive, lead, client, archived
  priority: text("priority").notNull().default("medium"),
  // low, medium, high, urgent
  tags: text("tags").array(),
  category: text("category"),
  // e.g., "Enterprise", "SMB", "Startup", "Agency"
  source: text("source"),
  // e.g., "Website", "Referral", "Cold Call", "LinkedIn"
  notes: text("notes"),
  lastContactDate: timestamp("last_contact_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_clients_user_id").on(table.userId),
  index("idx_clients_status").on(table.status),
  index("idx_clients_priority").on(table.priority),
  index("idx_clients_created_at").on(table.createdAt),
  index("idx_clients_email").on(table.email)
]);
var followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  // pending, completed, overdue
  priority: text("priority").notNull().default("medium"),
  // low, medium, high, urgent
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_followups_user_id").on(table.userId),
  index("idx_followups_client_id").on(table.clientId),
  index("idx_followups_status").on(table.status),
  index("idx_followups_due_date").on(table.dueDate),
  index("idx_followups_priority").on(table.priority),
  index("idx_followups_created_at").on(table.createdAt)
]);
var interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  type: text("type").notNull(),
  // call, email, meeting, note
  notes: text("notes").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_interactions_user_id").on(table.userId),
  index("idx_interactions_client_id").on(table.clientId),
  index("idx_interactions_type").on(table.type),
  index("idx_interactions_created_at").on(table.createdAt)
]);
var insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true
});
var insertFollowUpSchema = createInsertSchema(followUps).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true
}).extend({
  dueDate: z.union([z.date(), z.string()]).transform((val) => {
    if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  })
});
var insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  userId: true,
  createdAt: true
});
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: text("role", { enum: ["individual", "corporate"] }).notNull().default("individual"),
  company: varchar("company", { length: 255 }),
  // Required for corporate users
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  // Performance indexes for frequent queries
  index("idx_users_email").on(table.email),
  index("idx_users_role").on(table.role),
  index("idx_users_is_active").on(table.isActive)
]);
var sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull()
}, (table) => [
  index("idx_sessions_expire").on(table.expire)
]);
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
var registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  followUps: many(followUps),
  interactions: many(interactions)
}));
var clientsRelations = relations(clients, ({ many, one }) => ({
  followUps: many(followUps),
  interactions: many(interactions),
  user: one(users, {
    fields: [clients.userId],
    references: [users.id]
  })
}));
var followUpsRelations = relations(followUps, ({ one }) => ({
  client: one(clients, {
    fields: [followUps.clientId],
    references: [clients.id]
  }),
  user: one(users, {
    fields: [followUps.userId],
    references: [users.id]
  })
}));
var interactionsRelations = relations(interactions, ({ one }) => ({
  client: one(clients, {
    fields: [interactions.clientId],
    references: [clients.id]
  }),
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id]
  })
}));

// server/db.ts
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  // Reduced for Cloud Run environment
  min: 0,
  // Allow pool to scale down to 0
  connectionTimeoutMillis: 1e4,
  // Increased timeout for Cloud Run
  idleTimeoutMillis: 3e4,
  allowExitOnIdle: true,
  // Allow process to exit when pool is idle
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});
pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});
pool.on("connect", (client) => {
  console.log("PostgreSQL client connected");
});
pool.on("remove", (client) => {
  console.log("PostgreSQL client removed");
});
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    console.log("Database connection test successful");
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, like, or, and, sql } from "drizzle-orm";
var DatabaseStorage = class {
  // User authentication methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  // Client methods
  async getClients() {
    const result = await db.select().from(clients).orderBy(clients.updatedAt);
    return result.reverse();
  }
  async getClientsByUser(userId) {
    const result = await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(clients.updatedAt);
    return result.reverse();
  }
  async getClient(id) {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || void 0;
  }
  async createClient(insertClient) {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }
  async updateClient(id, updates) {
    const [client] = await db.update(clients).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(clients.id, id)).returning();
    return client || void 0;
  }
  async deleteClient(id) {
    await db.delete(followUps).where(eq(followUps.clientId, id));
    await db.delete(interactions).where(eq(interactions.clientId, id));
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount != null && result.rowCount > 0;
  }
  async searchClients(query) {
    const result = await db.select().from(clients).where(
      or(
        like(clients.name, `%${query}%`),
        like(clients.email, `%${query}%`),
        like(clients.company, `%${query}%`)
      )
    );
    return result;
  }
  async searchClientsByUser(userId, query) {
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
  async getFollowUps() {
    const result = await db.select().from(followUps).orderBy(followUps.dueDate);
    return result;
  }
  async getFollowUpsByUser(userId) {
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
      completedAt: followUps.completedAt
    }).from(followUps).where(eq(followUps.userId, userId)).orderBy(followUps.dueDate);
    return result;
  }
  async getFollowUp(id) {
    const [followUp] = await db.select().from(followUps).where(eq(followUps.id, id));
    return followUp || void 0;
  }
  async getFollowUpsByClient(clientId) {
    const result = await db.select().from(followUps).where(eq(followUps.clientId, clientId)).orderBy(followUps.dueDate);
    return result;
  }
  async createFollowUp(insertFollowUp) {
    const [followUp] = await db.insert(followUps).values(insertFollowUp).returning();
    return followUp;
  }
  async updateFollowUp(id, updates) {
    const [followUp] = await db.update(followUps).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date(),
      completedAt: updates.status === "completed" ? /* @__PURE__ */ new Date() : void 0
    }).where(eq(followUps.id, id)).returning();
    return followUp || void 0;
  }
  async deleteFollowUp(id) {
    const result = await db.delete(followUps).where(eq(followUps.id, id));
    return result.rowCount != null && result.rowCount > 0;
  }
  async getUpcomingFollowUps() {
    const now = /* @__PURE__ */ new Date();
    const result = await db.select().from(followUps).where(eq(followUps.status, "pending")).orderBy(followUps.dueDate);
    return result.filter((followUp) => new Date(followUp.dueDate) >= now);
  }
  async getUpcomingFollowUpsByUser(userId) {
    const now = /* @__PURE__ */ new Date();
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
      completedAt: followUps.completedAt
    }).from(followUps).where(and(
      eq(followUps.userId, userId),
      eq(followUps.status, "pending")
    )).orderBy(followUps.dueDate);
    return result.filter((followUp) => new Date(followUp.dueDate) >= now);
  }
  async getOverdueFollowUps() {
    const now = /* @__PURE__ */ new Date();
    const result = await db.select().from(followUps).where(eq(followUps.status, "pending")).orderBy(followUps.dueDate);
    return result.filter((followUp) => new Date(followUp.dueDate) < now);
  }
  async getOverdueFollowUpsByUser(userId) {
    const now = /* @__PURE__ */ new Date();
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
      completedAt: followUps.completedAt
    }).from(followUps).where(and(
      eq(followUps.userId, userId),
      eq(followUps.status, "pending")
    )).orderBy(followUps.dueDate);
    return result.filter((followUp) => new Date(followUp.dueDate) < now);
  }
  // Interaction methods
  async getInteractions() {
    const result = await db.select().from(interactions).orderBy(interactions.createdAt);
    return result.reverse();
  }
  async getInteractionsByUser(userId) {
    const result = await db.select({
      id: interactions.id,
      userId: interactions.userId,
      clientId: interactions.clientId,
      type: interactions.type,
      notes: interactions.notes,
      createdAt: interactions.createdAt
    }).from(interactions).innerJoin(clients, eq(interactions.clientId, clients.id)).where(eq(clients.userId, userId)).orderBy(interactions.createdAt);
    return result.reverse();
  }
  async getInteractionsByClient(clientId) {
    const result = await db.select().from(interactions).where(eq(interactions.clientId, clientId)).orderBy(interactions.createdAt);
    return result.reverse();
  }
  async createInteraction(insertInteraction) {
    const [interaction] = await db.insert(interactions).values(insertInteraction).returning();
    return interaction;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";

// server/auth.ts
import bcrypt from "bcrypt";
var hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};
var verifyPassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
var authenticateToken = async (req, res, next) => {
  try {
    console.log("Session debug:", {
      sessionId: req.sessionID,
      userId: req.session?.userId,
      sessionExists: !!req.session
    });
    const userId = req.session?.userId;
    if (!userId) {
      console.log("No userId in session");
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = await storage.getUser(userId);
    if (!user || !user.isActive) {
      console.log("User not found or inactive:", { userId, user: !!user });
      return res.status(401).json({ message: "User not found or inactive" });
    }
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      company: user.company || void 0
    };
    console.log("Authentication successful for user:", user.email);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

// server/middleware/cache.ts
import NodeCache from "node-cache";
var dashboardCache = new NodeCache({ stdTTL: 300 });
var clientCache = new NodeCache({ stdTTL: 600 });
var followUpCache = new NodeCache({ stdTTL: 180 });
var statsCache = new NodeCache({ stdTTL: 900 });
var generateCacheKey = (prefix, userId, ...params) => {
  return `${prefix}:${userId}:${params.join(":")}`;
};
var invalidateUserCache = (userId) => {
  const keys = [
    ...dashboardCache.keys().filter((key) => key.includes(`:${userId}:`)),
    ...clientCache.keys().filter((key) => key.includes(`:${userId}:`)),
    ...followUpCache.keys().filter((key) => key.includes(`:${userId}:`)),
    ...statsCache.keys().filter((key) => key.includes(`:${userId}:`))
  ];
  dashboardCache.del(keys.filter((key) => key.startsWith("dashboard:")));
  clientCache.del(keys.filter((key) => key.startsWith("clients:")));
  followUpCache.del(keys.filter((key) => key.startsWith("followups:")));
  statsCache.del(keys.filter((key) => key.startsWith("stats:")));
};
var cacheMiddleware = (cache, keyGenerator, ttl) => {
  return (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }
    const key = keyGenerator(req);
    const cached = cache.get(key);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }
    res.setHeader("X-Cache", "MISS");
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode === 200) {
        cache.set(key, data, ttl);
      }
      return originalJson.call(this, data);
    };
    next();
  };
};

// server/middleware/security.ts
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import slowDown from "express-slow-down";
import { body, validationResult } from "express-validator";
var createRateLimit = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { error: options.message || "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    // Use built-in IPv6-safe key generator
    skip: (req) => {
      return req.path === "/health" || req.path === "/api/health";
    }
  });
};
var authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // 5 attempts per 15 minutes
  message: "Too many authentication attempts, please try again later."
});
var apiRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 100,
  // 100 requests per minute
  message: "API rate limit exceeded, please slow down."
});
var strictRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 20,
  // 20 requests per minute for sensitive operations
  message: "Rate limit exceeded for this operation."
});
var progressiveSlowDown = slowDown({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  delayAfter: 10,
  // Allow 10 requests per windowMs without delay
  delayMs: () => 500,
  // Fixed 500ms delay per request after delayAfter
  maxDelayMs: 2e4,
  // Maximum delay of 20 seconds
  validate: { delayMs: false }
  // Disable warning
});
var corsOptions = process.env.NODE_ENV === "production" ? {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
    const defaultAllowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5000",
      // Allow Replit deployment domains
      ...process.env.REPLIT_DOMAINS?.split(",") || []
    ];
    const allAllowedOrigins = [...allowedOrigins, ...defaultAllowedOrigins];
    const isReplit = origin.endsWith(".replit.app");
    if (allAllowedOrigins.includes(origin) || isReplit) {
      callback(null, true);
    } else {
      console.log(`CORS rejected origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
} : {
  // Development - allow all origins
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
};
var validateClientInput = [
  body("name").trim().isLength({ min: 1, max: 100 }).withMessage("Name must be 1-100 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("phone").optional().isMobilePhone("any").withMessage("Valid phone number required"),
  body("company").optional().trim().isLength({ max: 100 }).withMessage("Company name too long"),
  body("status").isIn(["active", "inactive", "follow-up-needed"]).withMessage("Invalid status"),
  body("priority").isIn(["low", "medium", "high"]).withMessage("Invalid priority"),
  body("notes").optional().trim().isLength({ max: 1e3 }).withMessage("Notes too long")
];
var validateFollowUpInput = [
  body("clientId").isInt({ min: 1 }).withMessage("Valid client ID required"),
  body("title").trim().isLength({ min: 1, max: 200 }).withMessage("Title must be 1-200 characters"),
  body("description").optional().trim().isLength({ max: 1e3 }).withMessage("Description too long"),
  body("dueDate").isISO8601().withMessage("Valid due date required"),
  body("status").isIn(["pending", "completed", "cancelled"]).withMessage("Invalid status"),
  body("priority").isIn(["low", "medium", "high"]).withMessage("Invalid priority")
];
var validateInteractionInput = [
  body("clientId").isInt({ min: 1 }).withMessage("Valid client ID required"),
  body("type").isIn(["call", "email", "meeting", "other"]).withMessage("Invalid interaction type"),
  body("notes").trim().isLength({ min: 1, max: 1e3 }).withMessage("Notes must be 1-1000 characters")
];
var validateAuthInput = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 8, max: 128 }).withMessage("Password must be 8-128 characters")
];
var validateRegistrationInput = [
  ...validateAuthInput,
  body("firstName").trim().isLength({ min: 1, max: 50 }).withMessage("First name required"),
  body("lastName").trim().isLength({ min: 1, max: 50 }).withMessage("Last name required"),
  body("role").isIn(["freelancer", "corporate"]).withMessage("Invalid role"),
  body("company").optional().trim().isLength({ max: 100 }).withMessage("Company name too long"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  })
];
var xssProtection = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<.*?javascript:.*?>/gi, "").replace(/on\w+="[^"]*"/gi, "").replace(/on\w+='[^']*'/gi, "");
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (typeof value === "object" && value !== null) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  next();
};
var sqlInjectionProtection = (req, res, next) => {
  const suspiciousPatterns = [
    /(\%27)|(\')|((\%3D)|(=))[^\n]*((\%27)|(\'))/i,
    /(\%3B)|(\;)/i,
    /((\%22)|(\")|(\%27)|(\'))[^\n]*(or|and)[^\n]*((\%22)|(\")|(\%27)|(\'))/i,
    /exec(\s|\+)+(s|x)p\w+/i
  ];
  const checkForSQLi = (value) => {
    if (typeof value === "string") {
      return suspiciousPatterns.some((pattern) => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkForSQLi);
    }
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(checkForSQLi);
    }
    return false;
  };
  if (checkForSQLi(req.body) || checkForSQLi(req.query) || checkForSQLi(req.params)) {
    return res.status(400).json({ message: "Suspicious input detected" });
  }
  next();
};

// server/routes.ts
import cors from "cors";

// server/resend.ts
import { Resend } from "resend";
var resend = null;
function initializeResend() {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log("Resend email service initialized successfully");
    return true;
  } else {
    console.log("RESEND_API_KEY not provided - email functionality will be disabled");
    return false;
  }
}
initializeResend();
async function sendEmail(params) {
  try {
    if (!resend) {
      const initialized = initializeResend();
      if (!initialized) {
        return {
          success: false,
          error: "Email service not configured. Please add your RESEND_API_KEY to enable email functionality."
        };
      }
    }
    const fromEmail = `${params.fromName} <${params.from}>`;
    const toEmail = params.toName ? `${params.toName} <${params.to}>` : params.to;
    const emailData = {
      from: fromEmail,
      to: [toEmail],
      subject: params.subject,
      html: params.html || void 0,
      text: params.text || void 0
    };
    const response = await resend.emails.send(emailData);
    if (response.error) {
      console.error("Resend error:", response.error);
      return {
        success: false,
        error: response.error.message || "Failed to send email"
      };
    }
    return {
      success: true,
      messageId: response.data?.id || "unknown"
    };
  } catch (error) {
    console.error("Email sending error:", error);
    let errorMessage = "Failed to send email";
    if (error.message && error.message.includes("API key")) {
      errorMessage = "Email service authentication failed. Please check your Resend API key.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    return {
      success: false,
      error: errorMessage
    };
  }
}
var emailTemplates = {
  followUpReminder: {
    subject: "Follow-up on our recent conversation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello {{clientName}},</h2>
        <p>I hope this email finds you well. I wanted to follow up on our recent conversation regarding {{topic}}.</p>
        <p>{{message}}</p>
        <p>Please feel free to reach out if you have any questions or would like to schedule a call.</p>
        <p>Best regards,<br>{{senderName}}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This email was sent from Tracker Suite CRM</p>
      </div>
    `
  },
  welcomeMessage: {
    subject: "Welcome to our service!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome {{clientName}}!</h2>
        <p>Thank you for choosing our services. We're excited to work with you.</p>
        <p>{{message}}</p>
        <p>If you have any questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br>{{senderName}}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This email was sent from Tracker Suite CRM</p>
      </div>
    `
  },
  projectUpdate: {
    subject: "Project Update - {{projectName}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Project Update: {{projectName}}</h2>
        <p>Hello {{clientName}},</p>
        <p>I wanted to provide you with an update on {{projectName}}:</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          {{message}}
        </div>
        <p>Please let me know if you have any questions or feedback.</p>
        <p>Best regards,<br>{{senderName}}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This email was sent from Tracker Suite CRM</p>
      </div>
    `
  }
};
function renderEmailTemplate(templateKey, variables) {
  const template = emailTemplates[templateKey];
  if (!template) {
    throw new Error(`Template ${templateKey} not found`);
  }
  let subject = template.subject;
  let html = template.html;
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, "g"), value);
    html = html.replace(new RegExp(placeholder, "g"), value);
  });
  return { subject, html };
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.use(cors(corsOptions));
  if (process.env.NODE_ENV === "production") {
    app2.use("/api", apiRateLimit);
    app2.use("/api", xssProtection);
    app2.use("/api", sqlInjectionProtection);
  }
  const PostgresStore = pgSession(session);
  let sessionStore;
  try {
    sessionStore = new PostgresStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
      schemaName: "public",
      errorLog: (error) => {
        console.error("PostgreSQL session store error:", error);
      },
      ttl: 24 * 60 * 60,
      // 24 hours in seconds
      disableTouch: false,
      pruneSessionInterval: 60 * 15
      // Prune expired sessions every 15 minutes
    });
  } catch (error) {
    console.error("Failed to initialize PostgreSQL session store:", error);
    throw new Error("Session store initialization failed");
  }
  const isProduction = process.env.NODE_ENV === "production";
  app2.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: true,
    // Create session for all requests
    store: sessionStore,
    cookie: {
      secure: false,
      // Allow cookies over HTTP in development and deployment
      httpOnly: false,
      // Allow JS access to debug cookie issues
      maxAge: 24 * 60 * 60 * 1e3,
      // 24 hours
      sameSite: "lax",
      // Allow cross-site requests for deployment
      path: "/"
    },
    name: "connect.sid",
    // Explicit session name
    rolling: true
    // Refresh session on each request
  }));
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      if (validatedData.role === "corporate" && !validatedData.company) {
        return res.status(400).json({ message: "Company is required for corporate users" });
      }
      const hashedPassword = await hashPassword(validatedData.password);
      const { confirmPassword, ...userData } = validatedData;
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      req.session.userId = user.id;
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login request received:", req.body);
      console.log("Session before login:", req.session);
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const isValidPassword = await verifyPassword(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive" });
      }
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regenerate error:", err);
          return res.status(500).json({ message: "Session regenerate failed" });
        }
        req.session.userId = user.id;
        console.log("Session after regenerate and setting userId:", req.session);
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }
          console.log("Login successful, session saved for user:", user.email);
          console.log("Session ID:", req.sessionID);
          console.log("Final session data:", req.session);
          const { password, ...userResponse } = user;
          res.json(userResponse);
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.post("/api/auth/clear-session", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Clear session error:", err);
        return res.status(500).json({ message: "Clear session failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Session cleared successfully" });
    });
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
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
  app2.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const { firstName, lastName, email, role, company } = req.body;
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(409).json({ message: "Email already in use" });
      }
      const updatedUser = await storage.updateUser(req.user.id, {
        firstName,
        lastName,
        email,
        role,
        company: role === "corporate" ? company : null
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
  app2.put("/api/auth/password", authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const hashedNewPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(req.user.id, {
        password: hashedNewPassword
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
  app2.get(
    "/api/clients",
    authenticateToken,
    cacheMiddleware(
      clientCache,
      (req) => generateCacheKey("clients", req.user.id)
    ),
    async (req, res) => {
      try {
        const clients2 = await storage.getClientsByUser(req.user.id);
        res.json(clients2);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch clients" });
      }
    }
  );
  app2.get("/api/clients/search", authenticateToken, async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const clients2 = await storage.searchClientsByUser(req.user.id, query);
      res.json(clients2);
    } catch (error) {
      res.status(500).json({ message: "Failed to search clients" });
    }
  });
  app2.get("/api/clients/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      if (client.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });
  app2.post("/api/clients", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient({
        ...validatedData,
        userId: req.user.id
      });
      invalidateUserCache(req.user.id);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });
  app2.put("/api/clients/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      if (client.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const validatedData = insertClientSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(id, validatedData);
      invalidateUserCache(req.user.id);
      res.json(updatedClient);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });
  app2.delete("/api/clients/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      if (client.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const deleted = await storage.deleteClient(id);
      invalidateUserCache(req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });
  app2.get(
    "/api/follow-ups",
    authenticateToken,
    cacheMiddleware(
      followUpCache,
      (req) => generateCacheKey("followups", req.user.id)
    ),
    async (req, res) => {
      try {
        const followUps2 = await storage.getFollowUpsByUser(req.user.id);
        res.json(followUps2);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch follow-ups" });
      }
    }
  );
  app2.get(
    "/api/follow-ups/upcoming",
    authenticateToken,
    cacheMiddleware(
      followUpCache,
      (req) => generateCacheKey("followups:upcoming", req.user.id),
      180
    ),
    async (req, res) => {
      try {
        const followUps2 = await storage.getUpcomingFollowUpsByUser(req.user.id);
        res.json(followUps2);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch upcoming follow-ups" });
      }
    }
  );
  app2.get(
    "/api/follow-ups/overdue",
    authenticateToken,
    cacheMiddleware(
      followUpCache,
      (req) => generateCacheKey("followups:overdue", req.user.id),
      180
    ),
    async (req, res) => {
      try {
        const followUps2 = await storage.getOverdueFollowUpsByUser(req.user.id);
        res.json(followUps2);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch overdue follow-ups" });
      }
    }
  );
  app2.get("/api/follow-ups/client/:clientId", authenticateToken, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== req.user.id) {
        return res.status(404).json({ message: "Client not found" });
      }
      const followUps2 = await storage.getFollowUpsByClient(clientId);
      res.json(followUps2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client follow-ups" });
    }
  });
  app2.post("/api/follow-ups", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertFollowUpSchema.parse(req.body);
      const client = await storage.getClient(validatedData.clientId);
      if (!client || client.userId !== req.user.id) {
        return res.status(404).json({ message: "Client not found" });
      }
      const followUpData = {
        ...validatedData,
        dueDate: new Date(validatedData.dueDate),
        userId: req.user.id
      };
      const followUp = await storage.createFollowUp(followUpData);
      invalidateUserCache(req.user.id);
      res.status(201).json(followUp);
    } catch (error) {
      console.error("Failed to create follow-up:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid follow-up data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create follow-up" });
    }
  });
  app2.put("/api/follow-ups/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const followUp = await storage.getFollowUp(id);
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      const client = await storage.getClient(followUp.clientId);
      if (!client || client.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const validatedData = insertFollowUpSchema.partial().parse(req.body);
      const updatedFollowUp = await storage.updateFollowUp(id, validatedData);
      invalidateUserCache(req.user.id);
      res.json(updatedFollowUp);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid follow-up data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update follow-up" });
    }
  });
  app2.delete("/api/follow-ups/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const followUp = await storage.getFollowUp(id);
      if (!followUp) {
        return res.status(404).json({ message: "Follow-up not found" });
      }
      const client = await storage.getClient(followUp.clientId);
      if (!client || client.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const deleted = await storage.deleteFollowUp(id);
      invalidateUserCache(req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete follow-up" });
    }
  });
  app2.get("/api/interactions", authenticateToken, async (req, res) => {
    try {
      const interactions2 = await storage.getInteractionsByUser(req.user.id);
      res.json(interactions2);
    } catch (error) {
      console.error("Failed to fetch interactions:", error);
      res.status(500).json({ message: "Failed to fetch interactions" });
    }
  });
  app2.get("/api/interactions/client/:clientId", authenticateToken, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== req.user.id) {
        return res.status(404).json({ message: "Client not found" });
      }
      const interactions2 = await storage.getInteractionsByClient(clientId);
      res.json(interactions2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client interactions" });
    }
  });
  app2.post("/api/interactions", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertInteractionSchema.parse(req.body);
      const client = await storage.getClient(validatedData.clientId);
      if (!client || client.userId !== req.user.id) {
        return res.status(404).json({ message: "Client not found" });
      }
      const interaction = await storage.createInteraction({
        ...validatedData,
        userId: req.user.id
      });
      invalidateUserCache(req.user.id);
      res.status(201).json(interaction);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid interaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create interaction" });
    }
  });
  app2.get(
    "/api/dashboard/stats",
    authenticateToken,
    cacheMiddleware(
      dashboardCache,
      (req) => generateCacheKey("dashboard:stats", req.user.id),
      300
    ),
    async (req, res) => {
      try {
        const clients2 = await storage.getClientsByUser(req.user.id);
        const followUps2 = await storage.getFollowUpsByUser(req.user.id);
        const overdue = await storage.getOverdueFollowUpsByUser(req.user.id);
        const now = /* @__PURE__ */ new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
        const completedThisWeek = followUps2.filter(
          (f) => f.status === "completed" && f.completedAt && new Date(f.completedAt) >= weekAgo
        ).length;
        const newThisMonth = clients2.filter(
          (c) => new Date(c.createdAt) >= monthAgo
        ).length;
        const stats = {
          totalClients: clients2.length,
          pendingFollowups: followUps2.filter((f) => f.status === "pending").length,
          completedThisWeek,
          newThisMonth,
          overdueFollowups: overdue.length
        };
        res.json(stats);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
      }
    }
  );
  app2.get(
    "/api/analytics/overview",
    authenticateToken,
    cacheMiddleware(
      statsCache,
      (req) => generateCacheKey("analytics:overview", req.user.id),
      900
    ),
    async (req, res) => {
      try {
        const clients2 = await storage.getClientsByUser(req.user.id);
        const followUps2 = await storage.getFollowUpsByUser(req.user.id);
        const interactions2 = await storage.getInteractionsByUser(req.user.id);
        const analytics = {
          totalClients: clients2.length,
          activeClients: clients2.filter((c) => c.status === "active").length,
          totalInteractions: interactions2.length,
          totalFollowUps: followUps2.length,
          completedFollowUps: followUps2.filter((f) => f.status === "completed").length,
          overdueFollowUps: followUps2.filter((f) => f.status === "overdue").length,
          clientsByStatus: clients2.reduce((acc, client) => {
            acc[client.status] = (acc[client.status] || 0) + 1;
            return acc;
          }, {}),
          clientsByPriority: clients2.reduce((acc, client) => {
            acc[client.priority] = (acc[client.priority] || 0) + 1;
            return acc;
          }, {}),
          recentActivity: {
            clients: clients2.slice(-10),
            followUps: followUps2.slice(-10),
            interactions: interactions2.slice(-10)
          }
        };
        res.json(analytics);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
      }
    }
  );
  app2.post("/api/clients/:clientId/send-email", authenticateToken, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const { subject, message, template, fromEmail, fromName } = req.body;
      const client = await storage.getClient(clientId);
      if (!client || client.userId !== req.user.id) {
        return res.status(404).json({ message: "Client not found" });
      }
      if (!client.email) {
        return res.status(400).json({ message: "Client has no email address" });
      }
      let emailSubject = subject;
      let emailHtml = message;
      if (template && Object.keys(emailTemplates).includes(template)) {
        const user = await storage.getUser(req.user.id);
        const templateData = renderEmailTemplate(template, {
          clientName: client.name,
          senderName: fromName || `${user?.firstName} ${user?.lastName}` || "Support Team",
          message: message || "",
          topic: subject || "",
          projectName: subject || "Your Project"
        });
        emailSubject = templateData.subject;
        emailHtml = templateData.html;
      }
      const result = await sendEmail({
        to: client.email,
        toName: client.name,
        from: fromEmail || "noreply@yourcompany.com",
        // You should configure a proper from email
        fromName: fromName || "Support Team",
        subject: emailSubject,
        html: emailHtml
      });
      if (result.success) {
        await storage.createInteraction({
          clientId,
          userId: req.user.id,
          type: "email",
          notes: `Email sent: ${emailSubject}`,
          date: /* @__PURE__ */ new Date()
        });
        invalidateUserCache(req.user.id);
        res.status(200).json({
          message: "Email sent successfully",
          messageId: result.messageId
        });
      } else {
        res.status(500).json({
          message: "Failed to send email",
          error: result.error
        });
      }
    } catch (error) {
      console.error("Email sending error:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });
  app2.get("/api/email/templates", authenticateToken, async (req, res) => {
    try {
      const templates = Object.keys(emailTemplates).map((key) => ({
        id: key,
        name: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
        subject: emailTemplates[key].subject
      }));
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });
  app2.get("/api/export/clients", authenticateToken, async (req, res) => {
    try {
      const clients2 = await storage.getClientsByUser(req.user.id);
      const format = req.query.format || "csv";
      if (format === "csv") {
        const csvData = clients2.map((client) => ({
          Name: client.name,
          Email: client.email,
          Phone: client.phone || "",
          Company: client.company || "",
          Status: client.status,
          "Created At": client.createdAt,
          "Updated At": client.updatedAt,
          Notes: client.notes || ""
        }));
        const csvHeaders = Object.keys(csvData[0] || {});
        const csvRows = csvData.map(
          (row) => csvHeaders.map((header) => `"${row[header] || ""}"`).join(",")
        );
        const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="clients.csv"');
        res.send(csvContent);
      } else {
        res.json(clients2);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export clients" });
    }
  });
  app2.get("/api/export/follow-ups", authenticateToken, async (req, res) => {
    try {
      const followUps2 = await storage.getFollowUpsByUser(req.user.id);
      const clients2 = await storage.getClientsByUser(req.user.id);
      const clientMap = new Map(clients2.map((c) => [c.id, c]));
      const format = req.query.format || "csv";
      if (format === "csv") {
        const csvData = followUps2.map((followUp) => ({
          Title: followUp.title,
          Client: clientMap.get(followUp.clientId)?.name || "Unknown",
          "Due Date": followUp.dueDate,
          Status: followUp.status,
          "Created At": followUp.createdAt,
          "Completed At": followUp.completedAt || "",
          Description: followUp.description || ""
        }));
        const csvHeaders = Object.keys(csvData[0] || {});
        const csvRows = csvData.map(
          (row) => csvHeaders.map((header) => `"${row[header] || ""}"`).join(",")
        );
        const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="follow-ups.csv"');
        res.send(csvContent);
      } else {
        res.json(followUps2);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export follow-ups" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

// server/middleware/performance.ts
import compression from "compression";
import helmet from "helmet";
var compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024,
  // Only compress if response is larger than 1KB
  level: 6
  // Balanced compression level
});
var securityMiddleware = process.env.NODE_ENV === "production" ? helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536e3
    // 1 year in production
  }
}) : helmet({
  contentSecurityPolicy: false,
  // Completely disable CSP in development
  crossOriginEmbedderPolicy: false,
  hsts: false
});
var rateLimitConfig = {
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
};

// server/index.ts
var app = express2();
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  res.send = function(body2) {
    if (req.path.endsWith(".css")) {
      res.setHeader("Content-Type", "text/css; charset=utf-8");
    } else if (req.path.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    }
    return originalSend.call(this, body2);
  };
  res.json = function(obj) {
    if (!req.path.match(/\.(css|js|html|png|jpg|jpeg|svg)$/)) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    return originalJson.call(this, obj);
  };
  next();
});
app.get("/health", async (req, res) => {
  try {
    const dbHealthy = await testDatabaseConnection();
    const health = {
      status: dbHealthy ? "healthy" : "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: dbHealthy ? "connected" : "disconnected"
    };
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: "Health check failed",
      database: "error"
    });
  }
});
app.get("/ready", async (req, res) => {
  try {
    const dbReady = await testDatabaseConnection();
    if (dbReady) {
      res.status(200).json({
        status: "ready",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        database: "ready"
      });
    } else {
      res.status(503).json({
        status: "not ready",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        database: "not ready"
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      database: "error"
    });
  }
});
app.use(compressionMiddleware);
app.use(securityMiddleware);
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
process.on("SIGTERM", () => {
  log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
process.on("uncaughtException", (err) => {
  log(`Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});
async function initializeServer() {
  try {
    log("Starting server initialization...");
    log("Process arguments:", process.argv);
    log("Working directory:", process.cwd());
    log("__dirname equivalent:", import.meta.dirname);
    log("Testing database connection...");
    let dbConnected = false;
    let retryCount = 0;
    const maxRetries = 5;
    while (!dbConnected && retryCount < maxRetries) {
      try {
        dbConnected = await testDatabaseConnection();
        if (dbConnected) {
          log("Database connection verified");
          break;
        }
      } catch (error) {
        log(`Database connection attempt ${retryCount + 1}/${maxRetries} failed: ${error.message}`);
      }
      retryCount++;
      if (retryCount < maxRetries) {
        log(`Retrying database connection in 2 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 2e3));
      }
    }
    if (!dbConnected) {
      log("WARNING: Database connection failed after all retries, but continuing startup for health checks");
    }
    const path3 = await import("path");
    const fs2 = await import("fs");
    if (app.get("env") === "development") {
      log("Setting up development static file serving...");
      const devStaticPath = path3.resolve(import.meta.dirname, "public");
      if (fs2.existsSync(devStaticPath)) {
        log(`Serving static files from: ${devStaticPath}`);
        app.use("/assets", express2.static(path3.join(devStaticPath, "assets"), {
          setHeaders: (res, filePath) => {
            if (filePath.endsWith(".css")) {
              res.setHeader("Content-Type", "text/css; charset=utf-8");
              log(`[DEV-STATIC] Setting CSS MIME type for: ${filePath}`);
            } else if (filePath.endsWith(".js")) {
              res.setHeader("Content-Type", "application/javascript; charset=utf-8");
              log(`[DEV-STATIC] Setting JS MIME type for: ${filePath}`);
            }
            res.setHeader("X-Content-Type-Options", "nosniff");
          }
        }));
      }
      log("Development static file serving ready");
    } else {
      log("Setting up static file serving for production...");
      const path4 = await import("path");
      const fs3 = await import("fs");
      let distPath;
      if (fs3.existsSync(path4.resolve(import.meta.dirname, "public"))) {
        distPath = path4.resolve(import.meta.dirname, "public");
      } else {
        distPath = path4.resolve(import.meta.dirname, "..", "dist", "public");
      }
      log(`Looking for static files in: ${distPath}`);
      if (!fs3.existsSync(distPath)) {
        throw new Error(`Build directory not found: ${distPath}`);
      }
      app.use(express2.static(distPath, {
        maxAge: "1d",
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".css")) {
            res.setHeader("Content-Type", "text/css; charset=utf-8");
            log(`[STATIC] Setting CSS MIME type for: ${filePath}`);
          } else if (filePath.endsWith(".js")) {
            res.setHeader("Content-Type", "application/javascript; charset=utf-8");
            log(`[STATIC] Setting JS MIME type for: ${filePath}`);
          } else if (filePath.endsWith(".html")) {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
          } else if (filePath.endsWith(".png")) {
            res.setHeader("Content-Type", "image/png");
          } else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
            res.setHeader("Content-Type", "image/jpeg");
          } else if (filePath.endsWith(".svg")) {
            res.setHeader("Content-Type", "image/svg+xml");
          }
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("Cache-Control", "public, max-age=86400");
        }
      }));
      log("Static file serving ready");
    }
    const server = await registerRoutes(app);
    log("Routes registered successfully");
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("Vite development server ready");
    }
    app.get("*", (req, res) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/health") || req.originalUrl.startsWith("/ready")) {
        return res.status(404).json({ message: "Route not found" });
      }
      log(`[SPA] Serving index.html for: ${req.originalUrl}`);
      const path4 = __require("path");
      const distPath = process.env.NODE_ENV === "production" ? __require("path").resolve(import.meta.dirname, "public") : __require("path").resolve(import.meta.dirname, "..", "dist", "public");
      const indexPath = path4.resolve(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          log(`Error serving index.html: ${err.message}`);
          res.status(500).json({ message: "Failed to load application" });
        }
      });
    });
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error ${status}: ${message}`);
      console.error(err.stack);
      res.status(status).json({ message });
    });
    const port = parseInt(process.env.PORT || "5000", 10);
    log(`Attempting to start server on port ${port}...`);
    log(`Environment: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}`);
    return new Promise((resolve, reject) => {
      const serverInstance = server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true
      }, () => {
        log(`Server successfully started on port ${port}`);
        log(`Health check available at: http://0.0.0.0:${port}/health`);
        log(`Server listening on http://0.0.0.0:${port}`);
        resolve();
      });
      serverInstance.on("error", (err) => {
        log(`Failed to start server: ${err.message}`);
        console.error("Server startup error details:", err);
        reject(err);
      });
      serverInstance.on("listening", () => {
        const address = serverInstance.address();
        log(`Server is now listening on ${JSON.stringify(address)}`);
      });
      setTimeout(() => {
        log("Server startup timeout reached - 30 seconds elapsed");
        reject(new Error("Server startup timeout after 30 seconds"));
      }, 3e4);
    });
  } catch (error) {
    log(`Server initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    console.error("Full error details:", error);
    process.exit(1);
  }
}
initializeServer().catch((error) => {
  log(`Fatal error during server startup: ${error.message}`);
  console.error("Fatal error details:", error);
  process.exit(1);
});
