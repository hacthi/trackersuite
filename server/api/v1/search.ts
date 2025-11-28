import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../../storage';

const router = Router();

// Search query validation schema
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['clients', 'followups', 'interactions', 'all']).default('all'),
  limit: z.coerce.number().min(1).max(50).default(20),
  page: z.coerce.number().min(1).default(1),
  includeArchived: z.coerce.boolean().default(false)
});

// Advanced search with filters
const advancedSearchSchema = z.object({
  query: z.string().optional(),
  clients: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    company: z.string().optional(),
    status: z.enum(['active', 'inactive', 'archived']).optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional()
    }).optional()
  }).optional(),
  followups: z.object({
    status: z.enum(['pending', 'completed', 'overdue']).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional()
    }).optional()
  }).optional(),
  interactions: z.object({
    type: z.enum(['email', 'call', 'meeting', 'note']).optional(),
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional()
    }).optional()
  }).optional()
});

// GET /api/v1/search - Universal search across all entities
router.get('/', async (req, res) => {
  try {
    const searchParams = searchQuerySchema.parse(req.query);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const results = await storage.universalSearch(userId, {
      query: searchParams.q,
      type: searchParams.type,
      limit: searchParams.limit,
      page: searchParams.page,
      includeArchived: searchParams.includeArchived
    });

    res.json({
      data: results,
      query: searchParams.q,
      type: searchParams.type,
      pagination: {
        page: searchParams.page,
        limit: searchParams.limit,
        hasMore: results.length === searchParams.limit
      }
    });
  } catch (error) {
    console.error('Error performing search:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid search parameters',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Search failed' });
  }
});

// POST /api/v1/search/advanced - Advanced search with complex filters
router.post('/advanced', async (req, res) => {
  try {
    const searchParams = advancedSearchSchema.parse(req.body);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const results = await storage.advancedSearch(userId, searchParams);

    res.json({
      data: results,
      filters: searchParams,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error performing advanced search:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid search parameters',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Advanced search failed' });
  }
});

// GET /api/v1/search/suggestions - Get search suggestions based on partial query
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = z.object({
      q: z.string().min(1)
    }).parse(req.query);

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const suggestions = await storage.getSearchSuggestions(userId, q);

    res.json({
      data: suggestions,
      query: q
    });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// GET /api/v1/search/recent - Get recent search history
router.get('/recent', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const recentSearches = await storage.getRecentSearches(userId);

    res.json({
      data: recentSearches
    });
  } catch (error) {
    console.error('Error getting recent searches:', error);
    res.status(500).json({ error: 'Failed to get recent searches' });
  }
});

// POST /api/v1/search/save - Save a search query for later use
router.post('/save', async (req, res) => {
  try {
    const { name, query, filters } = z.object({
      name: z.string().min(1, 'Search name is required'),
      query: z.string().optional(),
      filters: z.object({}).passthrough()
    }).parse(req.body);

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const savedSearch = await storage.saveSearch(userId, {
      name,
      query,
      filters
    });

    res.status(201).json({
      data: savedSearch,
      message: 'Search saved successfully'
    });
  } catch (error) {
    console.error('Error saving search:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid search data',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Failed to save search' });
  }
});

// GET /api/v1/search/saved - Get user's saved searches
router.get('/saved', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const savedSearches = await storage.getSavedSearches(userId);

    res.json({
      data: savedSearches
    });
  } catch (error) {
    console.error('Error getting saved searches:', error);
    res.status(500).json({ error: 'Failed to get saved searches' });
  }
});

export { router as searchRouter };