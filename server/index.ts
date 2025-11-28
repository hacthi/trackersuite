import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { compressionMiddleware, securityMiddleware } from './middleware/performance';
import { testDatabaseConnection } from './db';
import { trialMonitor } from './trial-monitor';

const app = express();

// MIME type enforcement middleware - must be first to override any defaults
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override response methods to enforce correct content types
  res.send = function(body) {
    if (req.path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (req.path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    return originalSend.call(this, body);
  };
  
  res.json = function(obj) {
    // Only set JSON content type for actual JSON responses, not static files
    if (!req.path.match(/\.(css|js|html|png|jpg|jpeg|svg)$/)) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    return originalJson.call(this, obj);
  };
  
  next();
});

// Health check endpoint for deployment monitoring
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await testDatabaseConnection();
    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbHealthy ? 'connected' : 'disconnected'
    };
    
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      database: 'error'
    });
  }
});

// Readiness check endpoint 
app.get('/ready', async (req, res) => {
  try {
    const dbReady = await testDatabaseConnection();
    if (dbReady) {
      res.status(200).json({ 
        status: 'ready', 
        timestamp: new Date().toISOString(),
        database: 'ready'
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        database: 'not ready'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      database: 'error'
    });
  }
});

// Performance and security middleware
app.use(compressionMiddleware);
app.use(securityMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled error handling
process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Main server initialization with comprehensive error handling
async function initializeServer() {
  try {
    log('Starting server initialization...');
    log('Process arguments:', process.argv);
    log('Working directory:', process.cwd());
    log('__dirname equivalent:', import.meta.dirname);
    
    // Test database connection early (with retry logic for deployment)
    log('Testing database connection...');
    let dbConnected = false;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (!dbConnected && retryCount < maxRetries) {
      try {
        dbConnected = await testDatabaseConnection();
        if (dbConnected) {
          log('Database connection verified');
          break;
        }
      } catch (error) {
        log(`Database connection attempt ${retryCount + 1}/${maxRetries} failed: ${error.message}`);
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        log(`Retrying database connection in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!dbConnected) {
      log('WARNING: Database connection failed after all retries, but continuing startup for health checks');
    }
    
    // Setup static file serving FIRST for both development and production
    const path = await import('path');
    const fs = await import('fs');
    
    if (app.get("env") === "development") {
      log('Setting up development static file serving...');
      // In development, serve from server/public if it exists (for built assets during testing)
      const devStaticPath = path.resolve(import.meta.dirname, "public");
      if (fs.existsSync(devStaticPath)) {
        log(`Serving static files from: ${devStaticPath}`);
        app.use('/assets', express.static(path.join(devStaticPath, 'assets'), {
          setHeaders: (res, filePath) => {
            if (filePath.endsWith('.css')) {
              res.setHeader('Content-Type', 'text/css; charset=utf-8');
              log(`[DEV-STATIC] Setting CSS MIME type for: ${filePath}`);
            } else if (filePath.endsWith('.js')) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              log(`[DEV-STATIC] Setting JS MIME type for: ${filePath}`);
            }
            res.setHeader('X-Content-Type-Options', 'nosniff');
          }
        }));
      }
      log('Development static file serving ready');
      // We'll set up Vite after the server is created
    } else {
      log('Setting up static file serving for production...');
      
      const path = await import('path');
      const fs = await import('fs');
      
      // In production, the built server runs from dist/index.js
      // So we need to look for public assets relative to the dist directory
      let distPath;
      if (fs.existsSync(path.resolve(import.meta.dirname, "public"))) {
        // When running from dist/index.js, assets are in dist/public
        distPath = path.resolve(import.meta.dirname, "public");
      } else {
        // Fallback for development or different build structure
        distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
      }
      
      log(`Looking for static files in: ${distPath}`);
      
      if (!fs.existsSync(distPath)) {
        throw new Error(`Build directory not found: ${distPath}`);
      }
      
      // Single static file middleware with MIME type enforcement
      app.use(express.static(distPath, {
        maxAge: '1d',
        etag: true,
        setHeaders: (res, filePath) => {
          // Force correct MIME types for all static files
          if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            log(`[STATIC] Setting CSS MIME type for: ${filePath}`);
          } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            log(`[STATIC] Setting JS MIME type for: ${filePath}`);
          } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
          } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
          } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
          } else if (filePath.endsWith('.svg')) {
            res.setHeader('Content-Type', 'image/svg+xml');
          }
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      }));
      
      log('Static file serving ready');
    }

    // Register API routes AFTER static file serving
    const server = await registerRoutes(app);
    log('Routes registered successfully');
    
    // Now set up Vite for development
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log('Vite development server ready');
    }

    // SPA fallback - serve index.html for all non-API routes (placed AFTER everything)
    app.get('*', (req, res) => {
      // Skip API routes and health checks
      if (req.originalUrl.startsWith('/api') || 
          req.originalUrl.startsWith('/health') || 
          req.originalUrl.startsWith('/ready')) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      log(`[SPA] Serving index.html for: ${req.originalUrl}`);
      const distPath = process.env.NODE_ENV === 'production' 
        ? path.resolve(import.meta.dirname, "public")
        : path.resolve(import.meta.dirname, "..", "dist", "public");
      
      const indexPath = path.resolve(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          log(`Error serving index.html: ${err.message}`);
          res.status(500).json({ message: 'Failed to load application' });
        }
      });
    });

    // Global error handler - placed after all routes and static serving
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      log(`Error ${status}: ${message}`);
      console.error(err.stack);

      res.status(status).json({ message });
    });

    // Start trial monitoring service
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_TRIAL_MONITOR === 'true') {
      trialMonitor.start();
      log('Trial monitoring service started');
    } else {
      log('Trial monitoring disabled in development (set ENABLE_TRIAL_MONITOR=true to enable)');
    }

    // Get port from environment or default to 5000
    // Cloud Run provides PORT environment variable
    const port = parseInt(process.env.PORT || '5000', 10);
    log(`Attempting to start server on port ${port}...`);
    log(`Environment: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}`);

    // Start server
    return new Promise<void>((resolve, reject) => {
      const serverInstance = server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`Server successfully started on port ${port}`);
        log(`Health check available at: http://0.0.0.0:${port}/health`);
        log(`Server listening on http://0.0.0.0:${port}`);
        resolve();
      });

      serverInstance.on('error', (err) => {
        log(`Failed to start server: ${err.message}`);
        console.error('Server startup error details:', err);
        reject(err);
      });

      serverInstance.on('listening', () => {
        const address = serverInstance.address();
        log(`Server is now listening on ${JSON.stringify(address)}`);
      });

      // Set a timeout for server startup
      setTimeout(() => {
        log('Server startup timeout reached - 30 seconds elapsed');
        reject(new Error('Server startup timeout after 30 seconds'));
      }, 30000);
    });

  } catch (error) {
    log(`Server initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('Full error details:', error);
    process.exit(1);
  }
}

// Start the server
initializeServer().catch((error) => {
  log(`Fatal error during server startup: ${error.message}`);
  console.error('Fatal error details:', error);
  process.exit(1);
});
