import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../../storage';

const router = Router();

const analyticsQuerySchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  groupBy: z.enum(['day', 'week', 'month']).default('day')
});

// GET /api/v1/analytics/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const analytics = await storage.getDashboardAnalytics(userId, query);

    res.json({
      data: analytics,
      period: query.period,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/v1/analytics/clients
router.get('/clients', async (req, res) => {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const analytics = await storage.getClientAnalytics(userId, query);

    res.json({
      data: analytics,
      period: query.period,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching client analytics:', error);
    res.status(500).json({ error: 'Failed to fetch client analytics' });
  }
});

// GET /api/v1/analytics/performance
router.get('/performance', async (req, res) => {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const analytics = await storage.getPerformanceAnalytics(userId, query);

    res.json({
      data: analytics,
      period: query.period,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});

export { router as analyticsRouter };