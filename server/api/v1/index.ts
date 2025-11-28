import { Router } from 'express';
import { clientsRouter } from './clients';
import { followUpsRouter } from './followups';
import { interactionsRouter } from './interactions';
import { analyticsRouter } from './analytics';
import { webhooksRouter } from './webhooks';
import { searchRouter } from './search';
import { authenticateToken } from '../../auth';
import { apiRateLimit } from '../../middleware/security';

const router = Router();

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Tracker Suite API',
    version: '1.0.0',
    description: 'Comprehensive CRM API for client relationship management',
    endpoints: {
      clients: '/api/v1/clients',
      followups: '/api/v1/followups', 
      interactions: '/api/v1/interactions',
      analytics: '/api/v1/analytics',
      webhooks: '/api/v1/webhooks',
      search: '/api/v1/search'
    },
    authentication: 'Session-based authentication required',
    rateLimit: '100 requests per minute per IP'
  });
});

// Apply middleware
router.use(apiRateLimit);
router.use(authenticateToken);

// Mount sub-routers
router.use('/clients', clientsRouter);
router.use('/followups', followUpsRouter);
router.use('/interactions', interactionsRouter);
router.use('/analytics', analyticsRouter);
router.use('/webhooks', webhooksRouter);
router.use('/search', searchRouter);

export { router as apiV1Router };