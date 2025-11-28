import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { body, validationResult } from 'express-validator';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

// Advanced rate limiting for different endpoint types
export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: { error: options.message || 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator, // Use built-in IPv6-safe key generator
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  });
};

// Different rate limits for different operations
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
});

export const apiRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'API rate limit exceeded, please slow down.',
});

export const strictRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute for sensitive operations
  message: 'Rate limit exceeded for this operation.',
});

// Slow down middleware for progressive delays
export const progressiveSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // Allow 10 requests per windowMs without delay
  delayMs: () => 500, // Fixed 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: { delayMs: false }, // Disable warning
});

// CORS configuration - permissive in development, strict in production
export const corsOptions = process.env.NODE_ENV === 'production' ? {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    // In production, check against allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    // Add default allowed origins for common deployment scenarios
    const defaultAllowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:5000',
      // Allow Replit deployment domains
      ...process.env.REPLIT_DOMAINS?.split(',') || [],
    ];
    
    // Combine custom and default origins
    const allAllowedOrigins = [...allowedOrigins, ...defaultAllowedOrigins];
    
    // Allow any .replit.app domain for Replit deployments
    const isReplit = origin.endsWith('.replit.app');
    
    if (allAllowedOrigins.includes(origin) || isReplit) {
      callback(null, true);
    } else {
      console.log(`CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
} : {
  // Development - allow all origins
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

// Input validation schemas
export const validateClientInput = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('company').optional().trim().isLength({ max: 100 }).withMessage('Company name too long'),
  body('status').isIn(['active', 'inactive', 'follow-up-needed']).withMessage('Invalid status'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
];

export const validateFollowUpInput = [
  body('clientId').isInt({ min: 1 }).withMessage('Valid client ID required'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  body('dueDate').isISO8601().withMessage('Valid due date required'),
  body('status').isIn(['pending', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('priority').isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
];

export const validateInteractionInput = [
  body('clientId').isInt({ min: 1 }).withMessage('Valid client ID required'),
  body('type').isIn(['call', 'email', 'meeting', 'other']).withMessage('Invalid interaction type'),
  body('notes').trim().isLength({ min: 1, max: 1000 }).withMessage('Notes must be 1-1000 characters'),
];

export const validateAuthInput = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters'),
];

export const validateRegistrationInput = [
  ...validateAuthInput,
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name required'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name required'),
  body('role').isIn(['freelancer', 'corporate']).withMessage('Invalid role'),
  body('company').optional().trim().isLength({ max: 100 }).withMessage('Company name too long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
];

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// XSS protection middleware
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  // Basic XSS sanitization for common attack vectors
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<.*?javascript:.*?>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '');
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = {};
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

// SQL injection protection (additional layer beyond parameterized queries)
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\%27)|(\')|((\%3D)|(=))[^\n]*((\%27)|(\'))/i,
    /(\%3B)|(\;)/i,
    /((\%22)|(\")|(\%27)|(\'))[^\n]*(or|and)[^\n]*((\%22)|(\")|(\%27)|(\'))/i,
    /exec(\s|\+)+(s|x)p\w+/i,
  ];

  const checkForSQLi = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkForSQLi);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkForSQLi);
    }
    return false;
  };

  if (checkForSQLi(req.body) || checkForSQLi(req.query) || checkForSQLi(req.params)) {
    return res.status(400).json({ message: 'Suspicious input detected' });
  }

  next();
};