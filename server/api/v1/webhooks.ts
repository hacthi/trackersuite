import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../../storage';
import { webhookService } from '../../services/webhook-service';
import crypto from 'crypto';

const router = Router();

// Webhook validation schemas
const webhookSchema = z.object({
  name: z.string().min(1, 'Webhook name is required'),
  url: z.string().url('Valid URL is required'),
  events: z.array(z.enum([
    'client.created',
    'client.updated', 
    'client.deleted',
    'followup.created',
    'followup.updated',
    'followup.completed',
    'interaction.created',
    'user.trial_expiring',
    'user.trial_expired'
  ])).min(1, 'At least one event must be selected'),
  secret: z.string().optional(),
  active: z.boolean().default(true),
  headers: z.record(z.string()).optional()
});

const webhookUpdateSchema = webhookSchema.partial();

const webhookIdSchema = z.object({
  id: z.coerce.number()
});

// GET /api/v1/webhooks - List all webhooks for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const webhooks = await storage.getWebhooks(userId);

    res.json({
      data: webhooks
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// POST /api/v1/webhooks - Create new webhook
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const webhookData = webhookSchema.parse(req.body);

    // Generate a secret if not provided
    if (!webhookData.secret) {
      webhookData.secret = crypto.randomBytes(32).toString('hex');
    }

    const webhook = await storage.createWebhook({
      ...webhookData,
      userId
    });

    res.status(201).json({
      data: webhook,
      message: 'Webhook created successfully'
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// GET /api/v1/webhooks/:id - Get specific webhook
router.get('/:id', async (req, res) => {
  try {
    const { id } = webhookIdSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const webhook = await storage.getWebhook(id, userId);

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({
      data: webhook
    });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

// PUT /api/v1/webhooks/:id - Update webhook
router.put('/:id', async (req, res) => {
  try {
    const { id } = webhookIdSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updateData = webhookUpdateSchema.parse(req.body);

    const webhook = await storage.updateWebhook(id, userId, updateData);

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({
      data: webhook,
      message: 'Webhook updated successfully'
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// DELETE /api/v1/webhooks/:id - Delete webhook
router.delete('/:id', async (req, res) => {
  try {
    const { id } = webhookIdSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const success = await storage.deleteWebhook(id, userId);

    if (!success) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// POST /api/v1/webhooks/:id/test - Test webhook by sending a test payload
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = webhookIdSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const webhook = await storage.getWebhook(id, userId);

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    // Send test payload
    const testPayload = {
      event: 'webhook.test',
      data: {
        message: 'This is a test webhook payload',
        timestamp: new Date().toISOString(),
        webhook_id: id
      },
      userId
    };

    const result = await webhookService.sendWebhook(webhook, testPayload);

    res.json({
      message: 'Test webhook sent',
      result: {
        success: result.success,
        status: result.status,
        response: result.response
      }
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    res.status(500).json({ error: 'Failed to test webhook' });
  }
});

// GET /api/v1/webhooks/:id/deliveries - Get webhook delivery history
router.get('/:id/deliveries', async (req, res) => {
  try {
    const { id } = webhookIdSchema.parse(req.params);
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const webhook = await storage.getWebhook(id, userId);

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const deliveries = await storage.getWebhookDeliveries(id, {
      page: Number(page),
      limit: Number(limit)
    });

    res.json({
      data: deliveries.items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: deliveries.total,
        totalPages: Math.ceil(deliveries.total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching webhook deliveries:', error);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

// GET /api/v1/webhooks/events - List available webhook events
router.get('/events', (req, res) => {
  const events = [
    {
      name: 'client.created',
      description: 'Triggered when a new client is created',
      payload: {
        client: 'Client object',
        userId: 'User ID who created the client',
        timestamp: 'ISO timestamp'
      }
    },
    {
      name: 'client.updated',
      description: 'Triggered when a client is updated',
      payload: {
        client: 'Updated client object',
        previousData: 'Previous client data',
        userId: 'User ID who updated the client',
        timestamp: 'ISO timestamp'
      }
    },
    {
      name: 'client.deleted',
      description: 'Triggered when a client is deleted',
      payload: {
        client: 'Deleted client object',
        userId: 'User ID who deleted the client',
        timestamp: 'ISO timestamp'
      }
    },
    {
      name: 'followup.created',
      description: 'Triggered when a new follow-up is created',
      payload: {
        followup: 'Follow-up object',
        client: 'Associated client object',
        userId: 'User ID who created the follow-up',
        timestamp: 'ISO timestamp'
      }
    },
    {
      name: 'followup.completed',
      description: 'Triggered when a follow-up is marked as completed',
      payload: {
        followup: 'Completed follow-up object',
        client: 'Associated client object',
        userId: 'User ID who completed the follow-up',
        timestamp: 'ISO timestamp'
      }
    },
    {
      name: 'interaction.created',
      description: 'Triggered when a new interaction is logged',
      payload: {
        interaction: 'Interaction object',
        client: 'Associated client object',
        userId: 'User ID who logged the interaction',
        timestamp: 'ISO timestamp'
      }
    }
  ];

  res.json({
    data: events,
    count: events.length
  });
});

export { router as webhooksRouter };