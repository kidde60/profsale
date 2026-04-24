// middleware/cache.ts - Request/response caching with Redis
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

let redisClient: any = null;

/**
 * Initialize Redis client for caching
 */
async function initializeRedis() {
  if (redisClient) {
    return redisClient;
  }

  try {
    const Redis = require('redis');
    redisClient = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    });

    await redisClient.connect();
    logger.info('Redis client initialized for caching');
    
    redisClient.on('error', (err: Error) => {
      logger.error('Redis client error:', err);
    });

    return redisClient;
  } catch (error) {
    logger.warn('Redis initialization failed, caching disabled', { error });
    return null;
  }
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, prefix: string = 'cache'): string {
  const userId = (req as any).user?.id || 'anonymous';
  const businessId = (req as any).user?.businessId || 'default';
  const path = req.originalUrl || req.path;
  const queryParams = JSON.stringify(req.query);
  
  return `${prefix}:${userId}:${businessId}:${path}:${queryParams}`;
}

/**
 * Cache middleware options
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  skipCache?: (req: Request) => boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * Response cache middleware
 */
export const cacheResponse = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    prefix = 'cache',
    skipCache,
    keyGenerator,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if custom skip condition is met
    if (skipCache && skipCache(req)) {
      return next();
    }

    const client = await initializeRedis();
    
    if (!client) {
      // Redis not available, skip caching
      return next();
    }

    const cacheKey = keyGenerator ? keyGenerator(req) : generateCacheKey(req, prefix);

    try {
      // Try to get cached response
      const cached = await client.get(cacheKey);
      
      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        const cachedData = JSON.parse(cached);
        
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return res.json(cachedData);
      }

      logger.debug('Cache miss', { key: cacheKey });
      res.setHeader('X-Cache', 'MISS');

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode < 400) {
          const cacheData = {
            data,
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
          };

          // Cache asynchronously to not block response
          client
            .setEx(cacheKey, ttl, JSON.stringify(cacheData))
            .catch((err: Error) => {
              logger.error('Failed to cache response', { error: err, key: cacheKey });
            });
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error });
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<number> {
  const client = await initializeRedis();
  
  if (!client) {
    logger.warn('Cannot invalidate cache: Redis not available');
    return 0;
  }

  try {
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }

    await client.del(keys);
    logger.info(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
    return keys.length;
  } catch (error) {
    logger.error('Failed to invalidate cache', { error, pattern });
    return 0;
  }
}

/**
 * Invalidate cache for specific resource
 */
export async function invalidateResourceCache(
  resourceType: string,
  resourceId: number | string,
  businessId?: number,
): Promise<number> {
  const businessFilter = businessId ? `:${businessId}:` : ':';
  const pattern = `cache:*${businessFilter}*${resourceType}*${resourceId}*`;
  
  return invalidateCache(pattern);
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<number> {
  const client = await initializeRedis();
  
  if (!client) {
    logger.warn('Cannot clear cache: Redis not available');
    return 0;
  }

  try {
    const keys = await client.keys('cache:*');
    
    if (keys.length === 0) {
      return 0;
    }

    await client.del(keys);
    logger.info(`Cleared ${keys.length} cache keys`);
    return keys.length;
  } catch (error) {
    logger.error('Failed to clear cache', { error });
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<any> {
  const client = await initializeRedis();
  
  if (!client) {
    return {
      status: 'disabled',
      message: 'Redis not available',
    };
  }

  try {
    const info = await client.info('stats');
    const keys = await client.keys('cache:*');
    
    return {
      status: 'enabled',
      totalCachedKeys: keys.length,
      redisInfo: info,
    };
  } catch (error) {
    logger.error('Failed to get cache stats', { error });
    return {
      status: 'error',
      message: 'Failed to retrieve statistics',
    };
  }
}

/**
 * Cache invalidation middleware for mutations
 */
export const invalidateCacheOnMutation = (
  resourceType: string,
  getIdFromRequest: (req: Request) => number | string | undefined,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful mutation
    res.json = function(data: any) {
      if (res.statusCode < 400) {
        const resourceId = getIdFromRequest(req);
        const businessId = (req as any).user?.businessId;
        
        if (resourceId) {
          invalidateResourceCache(resourceType, resourceId, businessId).catch(err => {
            logger.error('Failed to invalidate cache after mutation', { error: err });
          });
        } else {
          // If no specific ID, invalidate all caches for this resource type
          const pattern = `cache:*:*:*${resourceType}*`;
          invalidateCache(pattern).catch(err => {
            logger.error('Failed to invalidate cache pattern after mutation', { error: err });
          });
        }
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Predefined cache configurations
 */
export const cacheConfig = {
  // Dashboard data - cache for 2 minutes
  dashboard: cacheResponse({ ttl: 120, prefix: 'dashboard' }),
  
  // Products - cache for 5 minutes
  products: cacheResponse({ ttl: 300, prefix: 'products' }),
  
  // Categories - cache for 10 minutes
  categories: cacheResponse({ ttl: 600, prefix: 'categories' }),
  
  // Reports - cache for 1 minute
  reports: cacheResponse({ ttl: 60, prefix: 'reports' }),
  
  // Settings - cache for 10 minutes
  settings: cacheResponse({ ttl: 600, prefix: 'settings' }),
};

export default {
  initializeRedis,
  generateCacheKey,
  cacheResponse,
  invalidateCache,
  invalidateResourceCache,
  clearAllCache,
  getCacheStats,
  invalidateCacheOnMutation,
  cacheConfig,
};
