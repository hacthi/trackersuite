import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../../storage';
import { insertFollowUpSchema } from '@shared/schema';
import { webhookService } from '../../services/webhook-service';

const router = Router();

const followUpQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'completed', 'overdue']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  clientId: z.coerce.number().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// GET /api/v1/followups
router.get('/', async (req, res) => {
  try {
    const query = followUpQuerySchema.parse(req.query);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const followUps = await storage.getFollowUps(userId, query);
    const total = await storage.getFollowUpCount(userId, query);

    res.json({
      data: followUps,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        hasNext: query.page * query.limit < total,
        hasPrev: query.page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

// POST /api/v1/followups
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const followUpData = insertFollowUpSchema.parse({
      ...req.body,
      userId
    });

    const followUp = await storage.createFollowUp(followUpData);
    const client = await storage.getClient(followUp.clientId, userId);

    await webhookService.trigger('followup.created', {
      followup: followUp,
      client,
      userId,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      data: followUp,
      message: 'Follow-up created successfully'
    });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
});

export { router as followUpsRouter };