// middleware/security.ts - Enhanced security headers and CORS configuration
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';

/**
 * Enhanced security headers configuration
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://profsale.dangotechconcepts.com"],
      mediaSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * Enhanced CORS configuration
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006',
      'https://profsale.dangotechconcepts.com',
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'api-version',
  ],
  exposedHeaders: ['Content-Length', 'X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

/**
 * Remove sensitive headers from responses
 */
export const removeSensitiveHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
};

/**
 * Add security-related response headers
 */
export const addSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add API version header
  res.setHeader('API-Version', '1.0.0');
  
  // Add request ID for tracing
  res.setHeader('X-Request-ID', req.headers['x-request-id'] as string || generateRequestId());
  
  next();
};

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate API version
 */
export const validateApiVersion = (req: Request, res: Response, next: NextFunction): void => {
  const apiVersion = req.headers['api-version'] as string;
  const supportedVersions = ['1.0', '1.1'];
  
  if (apiVersion && !supportedVersions.includes(apiVersion)) {
    res.status(400).json({
      success: false,
      message: 'Unsupported API version',
      supportedVersions,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  next();
};

/**
 * Block suspicious user agents
 */
export const blockSuspiciousUserAgents = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.headers['user-agent']?.toLowerCase() || '';
  
  const suspiciousPatterns = [
    /bot/,
    /crawler/,
    /spider/,
    /scraper/,
    /curl/,
    /wget/,
    /python-requests/,
    /java/,
    /go-http-client/,
  ];
  
  // Skip for health checks and allowed bots
  if (req.path === '/health' || req.path.startsWith('/health/')) {
    return next();
  }
  
  // Block suspicious user agents on non-GET requests
  if (req.method !== 'GET' && suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.warn('Blocked suspicious user agent', {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
    });
    
    res.status(403).json({
      success: false,
      message: 'Access denied',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  next();
};

/**
 * IP whitelist middleware
 */
export const ipWhitelist = (req: Request, res: Response, next: NextFunction): void => {
  const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
  
  if (trustedIPs.length > 0 && !trustedIPs.includes(req.ip || '')) {
    logger.warn('IP not in whitelist', { ip: req.ip, path: req.originalUrl });
    
    res.status(403).json({
      success: false,
      message: 'Access denied from this IP',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSize) {
      res.status(413).json({
        success: false,
        message: 'Request entity too large',
        maxSize: `${maxSize / 1024 / 1024}MB`,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    next();
  };
};

/**
 * Prevent parameter pollution
 */
export const preventParameterPollution = (req: Request, res: Response, next: NextFunction): void => {
  // Remove duplicate query parameters
  const uniqueQuery: any = {};
  
  Object.keys(req.query).forEach(key => {
    const value = req.query[key];
    
    // Keep only the first value if multiple values exist
    if (Array.isArray(value)) {
      uniqueQuery[key] = value[0];
    } else {
      uniqueQuery[key] = value;
    }
  });
  
  req.query = uniqueQuery;
  next();
};

/**
 * Content type validation
 */
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip validation for GET, DELETE, OPTIONS
    if (['GET', 'DELETE', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      res.status(400).json({
        success: false,
        message: 'Content-Type header is required',
        allowedTypes,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    const isAllowed = allowedTypes.some(type => contentType.includes(type));
    
    if (!isAllowed) {
      res.status(415).json({
        success: false,
        message: 'Unsupported Media Type',
        allowedTypes,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    next();
  };
};

/**
 * Security middleware composition
 */
export const securityMiddleware = [
  securityHeaders,
  cors(corsOptions),
  removeSensitiveHeaders,
  addSecurityHeaders,
  validateApiVersion,
  blockSuspiciousUserAgents,
  requestSizeLimiter(10 * 1024 * 1024), // 10MB
  preventParameterPollution,
  validateContentType(['application/json', 'multipart/form-data']),
];

import logger from '../utils/logger';

export default {
  securityHeaders,
  corsOptions,
  removeSensitiveHeaders,
  addSecurityHeaders,
  validateApiVersion,
  blockSuspiciousUserAgents,
  ipWhitelist,
  requestSizeLimiter,
  preventParameterPollution,
  validateContentType,
  securityMiddleware,
};
