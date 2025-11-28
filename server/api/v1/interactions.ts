import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../../storage';
import { insertInteractionSchema } from '@shared/schema';
import { webhookService } from '../../services/webhook-service';

const router = Router();

const interactionQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  clientId: z.coerce.number().optional(),
  type: z.enum(['email', 'call', 'meeting', 'note']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['date', 'type', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// GET /api/v1/interactions
router.get('/', async (req, res) => {
  try {
    const query = interactionQuerySchema.parse(req.query);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const interactions = await storage.getInteractions(userId, query);
    const total = await storage.getInteractionCount(userId, query);

    res.json({
      data: interactions,
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
    console.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
});

// POST /api/v1/interactions
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const interactionData = insertInteractionSchema.parse({
      ...req.body,
      userId
    });

    const interaction = await storage.createInteraction(interactionData);
    const client = await storage.getClient(interaction.clientId, userId);

    await webhookService.trigger('interaction.created', {
      interaction,
      client,
      userId,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      data: interaction,
      message: 'Interaction logged successfully'
    });
  } catch (error) {
    console.error('Error creating interaction:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Failed to log interaction' });
  }
});

export { router as interactionsRouter };