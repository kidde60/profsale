// middleware/redisRateLimit.ts - Redis-based rate limiting for production
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import logger from '../utils/logger';

let redisClient: any = null;

/**
 * Initialize Redis client
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
    logger.info('Redis client initialized for rate limiting');
    
    redisClient.on('error', (err: Error) => {
      logger.error('Redis client error:', err);
    });

    return redisClient;
  } catch (error) {
    logger.warn('Redis initialization failed, falling back to memory store', { error });
    return null;
  }
}

/**
 * Rate limit response handler
 */
const rateLimitHandler = (req: Request, res: Response) => {
  const resetTime = (req as any).rateLimit?.resetTime?.getTime();
  const retryAfter = resetTime ? Math.round((resetTime - Date.now()) / 1000) : 900;

  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.originalUrl,
    method: req.method,
    userId: (req as any).user?.id,
  });

  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.max(1, retryAfter),
    limit: (req as any).rateLimit?.limit,
    remaining: (req as any).rateLimit?.remaining,
    resetTime: (req as any).rateLimit?.resetTime,
    timestamp: new Date().toISOString(),
  });
};

/**
 * General API rate limiter with Redis
 */
export const generalRateLimit = async () => {
  const client = await initializeRedis();
  
  const store = client
    ? new RedisStore({
        client: client as any,
        prefix: 'rate_limit:general:',
      } as any)
    : undefined;

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    store: store as any,
    skip: (req: any) => req.path === '/health' || req.path.startsWith('/health/'),
    keyGenerator: (req: any) => (req as any).user?.id?.toString() || req.ip,
  } as any);
};

/**
 * Authentication rate limiter (stricter)
 */
export const authRateLimit = async () => {
  const client = await initializeRedis();
  
  const store = client
    ? new RedisStore({
        client: client as any,
        prefix: 'rate_limit:auth:',
      } as any)
    : undefined;

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    store: store as any,
    skipSuccessfulRequests: true,
    keyGenerator: (req: any) => {
      const login = req.body?.login || req.body?.phone || req.body?.email;
      return `auth:${login}:${req.ip}`;
    },
  } as any);
};

/**
 * File upload rate limiter
 */
export const uploadRateLimit = async () => {
  const client = await initializeRedis();
  
  const store = client
    ? new RedisStore({
        client: client as any,
        prefix: 'rate_limit:upload:',
      } as any)
    : undefined;

  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each user to 10 uploads per hour
    message: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    store: store as any,
    keyGenerator: (req: any) => `upload:${(req as any).user?.id || req.ip}`,
  } as any);
};

/**
 * Sales creation rate limiter
 */
export const salesRateLimit = async () => {
  const client = await initializeRedis();
  
  const store = client
    ? new RedisStore({
        client: client as any,
        prefix: 'rate_limit:sales:',
      } as any)
    : undefined;

  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Max 30 sales per minute per user
    message: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    store: store as any,
    keyGenerator: (req: any) => `sales:${(req as any).user?.id}`,
  } as any);
};

/**
 * Password reset rate limiter
 */
export const passwordResetRateLimit = async () => {
  const client = await initializeRedis();
  
  const store = client
    ? new RedisStore({
        client: client as any,
        prefix: 'rate_limit:reset:',
      } as any)
    : undefined;

  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Max 3 password reset attempts per hour per IP
    message: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    store: store as any,
    keyGenerator: (req: any) => `reset:${req.ip}`,
  } as any);
};

/**
 * Subscription-based rate limiting
 */
export const subscriptionBasedRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user) {
    return next();
  }

  const subscriptionPlan = user.subscriptionPlan || 'starter';
  const limits = {
    starter: { requests: 50, window: 15 * 60 * 1000 },
    business: { requests: 200, window: 15 * 60 * 1000 },
    enterprise: { requests: 1000, window: 15 * 60 * 1000 },
  };

  const limit = limits[subscriptionPlan as keyof typeof limits] || limits.starter;

  const client = await initializeRedis();
  const store = client
    ? new RedisStore({
        client: client as any,
        prefix: `rate_limit:subscription:${subscriptionPlan}:`,
      } as any)
    : undefined;

  const limiter = rateLimit({
    windowMs: limit.window,
    max: limit.requests,
    message: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    store: store as any,
    keyGenerator: (_req: any) => `subscription:${user.id}`,
  } as any);

  return limiter(req, res, next);
};

/**
 * Admin rate limit bypass
 */
export const adminRateLimitBypass = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (user?.role === 'admin' || user?.permissions?.isAdmin) {
    return next();
  }

  const limiter = await generalRateLimit();
  return limiter(req, res, next);
};

/**
 * Get Redis rate limit statistics
 */
export async function getRateLimitStats() {
  const client = await initializeRedis();
  
  if (!client) {
    return {
      status: 'memory',
      message: 'Using memory store (Redis not available)',
    };
  }

  try {
    const keys = await client.keys('rate_limit:*');
    const stats = {
      status: 'redis',
      totalKeys: keys.length,
      keysByPrefix: {} as Record<string, number>,
    };

    keys.forEach((key: string) => {
      const parts = key.split(':');
      const prefix = parts[1] || 'unknown';
      stats.keysByPrefix[prefix] = (stats.keysByPrefix[prefix] || 0) + 1;
    });

    return stats;
  } catch (error) {
    logger.error('Failed to get rate limit stats', { error });
    return {
      status: 'error',
      message: 'Failed to retrieve statistics',
    };
  }
}

/**
 * Clear rate limit data for a specific key
 */
export async function clearRateLimitKey(key: string) {
  const client = await initializeRedis();
  
  if (!client) {
    logger.warn('Cannot clear rate limit key: Redis not available');
    return false;
  }

  try {
    await client.del(key);
    logger.info(`Cleared rate limit key: ${key}`);
    return true;
  } catch (error) {
    logger.error('Failed to clear rate limit key', { error, key });
    return false;
  }
}

/**
 * Clear all rate limit data (use with caution)
 */
export async function clearAllRateLimits() {
  const client = await initializeRedis();
  
  if (!client) {
    logger.warn('Cannot clear rate limits: Redis not available');
    return false;
  }

  try {
    const keys = await client.keys('rate_limit:*');
    
    if (keys.length === 0) {
      logger.info('No rate limit keys to clear');
      return true;
    }

    await client.del(keys);
    logger.info(`Cleared ${keys.length} rate limit keys`);
    return true;
  } catch (error) {
    logger.error('Failed to clear rate limits', { error });
    return false;
  }
}

export default {
  initializeRedis,
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  salesRateLimit,
  passwordResetRateLimit,
  subscriptionBasedRateLimit,
  adminRateLimitBypass,
  getRateLimitStats,
  clearRateLimitKey,
  clearAllRateLimits,
};
