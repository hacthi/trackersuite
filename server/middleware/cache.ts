import NodeCache from 'node-cache';

// Create cache instances with different TTL for different data types
export const dashboardCache = new NodeCache({ stdTTL: 300 }); // 5 minutes for dashboard data
export const clientCache = new NodeCache({ stdTTL: 600 }); // 10 minutes for client lists
export const followUpCache = new NodeCache({ stdTTL: 180 }); // 3 minutes for follow-ups (more dynamic)
export const statsCache = new NodeCache({ stdTTL: 900 }); // 15 minutes for statistics

// Cache key generators
export const generateCacheKey = (prefix: string, userId: number, ...params: (string | number)[]): string => {
  return `${prefix}:${userId}:${params.join(':')}`;
};

// Cache invalidation helpers
export const invalidateUserCache = (userId: number) => {
  const keys = [
    ...dashboardCache.keys().filter(key => key.includes(`:${userId}:`)),
    ...clientCache.keys().filter(key => key.includes(`:${userId}:`)),
    ...followUpCache.keys().filter(key => key.includes(`:${userId}:`)),
    ...statsCache.keys().filter(key => key.includes(`:${userId}:`)),
  ];
  
  dashboardCache.del(keys.filter(key => key.startsWith('dashboard:')));
  clientCache.del(keys.filter(key => key.startsWith('clients:')));
  followUpCache.del(keys.filter(key => key.startsWith('followups:')));
  statsCache.del(keys.filter(key => key.startsWith('stats:')));
};

// Cache middleware factory
export const cacheMiddleware = (cache: NodeCache, keyGenerator: (req: any) => string, ttl?: number) => {
  return (req: any, res: any, next: any) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator(req);
    const cached = cache.get(key);
    
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }
    
    res.setHeader('X-Cache', 'MISS');
    
    // Store original json function
    const originalJson = res.json;
    
    // Override json function to cache response
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        cache.set(key, data, ttl);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};