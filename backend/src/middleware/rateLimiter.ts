// middleware/rateLimiting.ts
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../utils/logger';

// Rate limit store (in production, use Redis)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const memoryStore: RateLimitStore = {};

// Custom rate limit store for memory (use Redis in production)
const createMemoryStore = () => {
  return {
    incr: (
      key: string,
      callback: (
        err: any,
        result?: { totalHits: number; resetTime?: Date },
      ) => void,
    ) => {
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes

      if (!memoryStore[key] || now > memoryStore[key].resetTime) {
        memoryStore[key] = {
          count: 1,
          resetTime: now + windowMs,
        };
      } else {
        memoryStore[key].count++;
      }

      callback(null, {
        totalHits: memoryStore[key].count,
        resetTime: new Date(memoryStore[key].resetTime),
      });
    },

    decrement: (key: string) => {
      if (memoryStore[key]) {
        memoryStore[key].count = Math.max(0, memoryStore[key].count - 1);
      }
    },

    resetKey: (key: string) => {
      delete memoryStore[key];
    },
  };
};

// Rate limit response handler
const rateLimitHandler = (req: Request, res: Response) => {
  const retryAfter =
    Math.round(req.rateLimit?.resetTime?.getTime() - Date.now()) / 1000 || 900;

  logger.warn('Rate limit exceeded:', {
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
    limit: req.rateLimit?.limit,
    remaining: req.rateLimit?.remaining,
    resetTime: req.rateLimit?.resetTime,
    timestamp: new Date().toISOString(),
  });
};

// Skip successful requests for certain endpoints
const skipSuccessfulRequests = (req: Request, res: Response) => {
  return res.statusCode < 400;
};

// General API rate limiter
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: createMemoryStore(),
  skip: (req, res) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  keyGenerator: req => {
    // Use user ID if authenticated, otherwise IP
    return (req as any).user?.id?.toString() || req.ip;
  },
});

// Authentication rate limiter (stricter)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMemoryStore(),
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: req => {
    // Use login identifier + IP for more granular limiting
    const login = req.body?.login || req.body?.phone || req.body?.email;
    return `auth:${login}:${req.ip}`;
  },
});

// File upload rate limiter
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each user to 10 uploads per hour
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMemoryStore(),
  keyGenerator: req => {
    return `upload:${(req as any).user?.id || req.ip}`;
  },
});

// Sales creation rate limiter (prevent spam sales)
export const salesRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Max 30 sales per minute per user
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMemoryStore(),
  keyGenerator: req => {
    return `sales:${(req as any).user?.id}`;
  },
});

// Password reset rate limiter
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 password reset attempts per hour per IP
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  store: createMemoryStore(),
  keyGenerator: req => {
    return `reset:${req.ip}`;
  },
});

// API endpoint specific rate limiters
export const endpointRateLimits = {
  // Product search (higher limit for better UX)
  productSearch: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 searches per minute
    message: rateLimitHandler,
    store: createMemoryStore(),
  }),

  // Report generation (lower limit due to computational cost)
  reports: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 reports per 5 minutes
    message: rateLimitHandler,
    store: createMemoryStore(),
  }),

  // Customer creation
  customerCreation: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 customers per minute
    message: rateLimitHandler,
    store: createMemoryStore(),
  }),

  // Inventory updates
  inventoryUpdate: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 inventory updates per minute
    message: rateLimitHandler,
    store: createMemoryStore(),
  }),
};

// Dynamic rate limiting based on user subscription
export const subscriptionBasedRateLimit = (
  req: Request,
  res: Response,
  next: Function,
) => {
  const user = (req as any).user;

  if (!user) {
    return next();
  }

  // Get user's subscription plan (this would come from database)
  const subscriptionPlan = user.subscriptionPlan || 'starter';

  // Define limits based on subscription
  const limits = {
    starter: { requests: 50, window: 15 * 60 * 1000 }, // 50 requests per 15 min
    business: { requests: 200, window: 15 * 60 * 1000 }, // 200 requests per 15 min
    enterprise: { requests: 1000, window: 15 * 60 * 1000 }, // 1000 requests per 15 min
  };

  const limit =
    limits[subscriptionPlan as keyof typeof limits] || limits.starter;

  const dynamicRateLimit = rateLimit({
    windowMs: limit.window,
    max: limit.requests,
    message: rateLimitHandler,
    store: createMemoryStore(),
    keyGenerator: req => `subscription:${user.id}`,
  });

  return dynamicRateLimit(req, res, next);
};

// Rate limit bypass for admin users
export const adminRateLimitBypass = (
  req: Request,
  res: Response,
  next: Function,
) => {
  const user = (req as any).user;

  // Skip rate limiting for admin users
  if (user?.role === 'admin' || user?.permissions?.isAdmin) {
    return next();
  }

  // Apply general rate limiting for non-admin users
  return generalRateLimit(req, res, next);
};

// Rate limit monitoring and metrics
export const rateLimitMetrics = {
  getStats: () => {
    const stats = {
      totalKeys: Object.keys(memoryStore).length,
      activeKeys: 0,
      averageCount: 0,
    };

    const now = Date.now();
    let totalCount = 0;

    for (const [key, data] of Object.entries(memoryStore)) {
      if (now < data.resetTime) {
        stats.activeKeys++;
        totalCount += data.count;
      }
    }

    stats.averageCount =
      stats.activeKeys > 0 ? totalCount / stats.activeKeys : 0;

    return stats;
  },

  cleanup: () => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, data] of Object.entries(memoryStore)) {
      if (now >= data.resetTime) {
        delete memoryStore[key];
        cleaned++;
      }
    }

    logger.info(`Rate limit cleanup: removed ${cleaned} expired entries`);
    return cleaned;
  },
};

// Periodic cleanup (run every 30 minutes)
setInterval(
  () => {
    rateLimitMetrics.cleanup();
  },
  30 * 60 * 1000,
);

// IP whitelist for trusted sources
const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];

export const ipWhitelist = (req: Request, res: Response, next: Function) => {
  if (trustedIPs.includes(req.ip)) {
    logger.info(`Whitelisted IP access: ${req.ip}`);
    return next();
  }

  return generalRateLimit(req, res, next);
};
