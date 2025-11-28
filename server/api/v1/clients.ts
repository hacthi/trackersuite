import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../../storage';
import { insertClientSchema, type Client } from '@shared/schema';
import { webhookService } from '../../services/webhook-service';

const router = Router();

// Input validation schemas
const clientQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  sortBy: z.enum(['name', 'email', 'company', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const clientIdSchema = z.object({
  id: z.coerce.number()
});

// GET /api/v1/clients - List all clients with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const query = clientQuerySchema.parse(req.query);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const clients = await storage.getClients(userId, {
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    });

    const total = await storage.getClientCount(userId, {
      search: query.search,
      status: query.status
    });

    res.json({
      data: clients,
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
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/v1/clients/:id - Get specific client
router.get('/:id', async (req, res) => {
  try {
    const { id } = clientIdSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const client = await storage.getClient(id, userId);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ data: client });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/v1/clients - Create new client
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const clientData = insertClientSchema.parse({
      ...req.body,
      userId
    });

    const client = await storage.createClient(clientData);

    // Trigger webhook for client creation
    await webhookService.trigger('client.created', {
      client,
      userId,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ 
      data: client,
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Error creating client:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/v1/clients/:id - Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = clientIdSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if client exists and belongs to user
    const existingClient = await storage.getClient(id, userId);
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updateData = insertClientSchema.partial().parse(req.body);
    const updatedClient = await storage.updateClient(id, userId, updateData);

    // Trigger webhook for client update
    await webhookService.trigger('client.updated', {
      client: updatedClient,
      previousData: existingClient,
      userId,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      data: updatedClient,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('Error updating client:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/v1/clients/:id - Delete client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = clientIdSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if client exists and belongs to user
    const existingClient = await storage.getClient(id, userId);
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await storage.deleteClient(id, userId);

    // Trigger webhook for client deletion
    await webhookService.trigger('client.deleted', {
      client: existingClient,
      userId,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// GET /api/v1/clients/:id/followups - Get client's follow-ups
router.get('/:id/followups', async (req, res) => {
  try {
    const { id } = clientIdSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if client exists and belongs to user
    const client = await storage.getClient(id, userId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const followUps = await storage.getFollowUps(userId, { clientId: id });

    res.json({ data: followUps });
  } catch (error) {
    console.error('Error fetching client follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

// GET /api/v1/clients/:id/interactions - Get client's interactions
router.get('/:id/interactions', async (req, res) => {
  try {
    const { id } = clientIdSchema.parse(req.params);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if client exists and belongs to user
    const client = await storage.getClient(id, userId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const interactions = await storage.getInteractions(userId, { clientId: id });

    res.json({ data: interactions });
  } catch (error) {
    console.error('Error fetching client interactions:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
});

export { router as clientsRouter };