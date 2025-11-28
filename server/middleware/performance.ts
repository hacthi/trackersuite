import compression from 'compression';
import helmet from 'helmet';
import type { Request, Response, NextFunction } from 'express';

// Compression middleware with optimized settings
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress if response is larger than 1KB
  level: 6, // Balanced compression level
});

// Security middleware - disabled CSP in development for Vite compatibility
export const securityMiddleware = process.env.NODE_ENV === 'production' ? helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1 year in production
  },
}) : helmet({
  contentSecurityPolicy: false, // Completely disable CSP in development
  crossOriginEmbedderPolicy: false,
  hsts: false,
});

// Request timing middleware for performance monitoring
export const timingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Log slow requests (>500ms)
    if (duration > 500) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
};

// Database connection pooling optimization
export const optimizeDatabasePool = () => ({
  max: 20, // Maximum number of connections in pool
  min: 2, // Minimum number of connections in pool
  acquire: 30000, // Maximum time to wait for connection (30s)
  idle: 10000, // Maximum time connection can be idle (10s)
  evict: 1000, // How often to run eviction (1s)
});