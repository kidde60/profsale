import morgan from 'morgan';
import { Request, Response } from 'express';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// Custom token for user ID
morgan.token('user-id', (req: AuthenticatedRequest) => {
  return req.user?.id?.toString() || 'anonymous';
});

// Custom token for business ID
morgan.token('business-id', (req: AuthenticatedRequest) => {
  return req.user?.business_id?.toString() || 'none';
});

// Custom token for request ID (if you want to implement request tracking)
morgan.token('request-id', (req: Request) => {
  return (req as any).id || 'none';
});

// Custom token for response size
morgan.token('response-size', (req: Request, res: Response) => {
  const length = res.get('content-length');
  return length ? `${length}b` : 'unknown';
});

// Custom token for user agent (shortened)
morgan.token('user-agent-short', (req: Request) => {
  const ua = req.get('User-Agent') || '';
  return ua.length > 50 ? `${ua.substring(0, 50)}...` : ua;
});

// Custom token for real IP (considering proxies)
morgan.token('real-ip', (req: Request) => {
  return (
    req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    req.get('X-Real-IP') ||
    req.ip ||
    req.connection.remoteAddress ||
    'unknown'
  );
});

// Custom format for development
const developmentFormat = [
  ':method',
  ':url',
  ':status',
  ':response-time ms',
  '- :response-size',
  '- User: :user-id',
  '- Business: :business-id',
  '- IP: :real-ip',
].join(' ');

// Custom format for production
const productionFormat = [
  ':real-ip',
  '- :user-id',
  '[:date[clf]]',
  '":method :url HTTP/:http-version"',
  ':status',
  ':response-size',
  '":referrer"',
  '":user-agent-short"',
  ':response-time ms',
].join(' ');

// Custom format for JSON logging
const jsonFormat = (tokens: any, req: Request, res: Response) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res)) || 0,
    responseTime: parseFloat(tokens['response-time'](req, res)) || 0,
    responseSize: tokens['response-size'](req, res),
    userAgent: req.get('User-Agent'),
    ip: tokens['real-ip'](req, res),
    userId: tokens['user-id'](req, res),
    businessId: tokens['business-id'](req, res),
    referrer: tokens.referrer(req, res),
    httpVersion: tokens['http-version'](req, res),
    requestId: tokens['request-id'](req, res),
  };

  return JSON.stringify(logData);
};

// Stream for Winston logger
const stream = {
  write: (message: string) => {
    // Remove trailing newline
    const cleanMessage = message.trim();

    try {
      // Try to parse as JSON for structured logging
      const logData = JSON.parse(cleanMessage);

      // Log based on status code
      if (logData.status >= 500) {
        logger.error('HTTP Request', logData);
      } else if (logData.status >= 400) {
        logger.warn('HTTP Request', logData);
      } else {
        logger.info('HTTP Request', logData);
      }
    } catch (error) {
      // Fallback to simple string logging
      logger.info(cleanMessage);
    }
  },
};

// Skip logging for certain paths
const skip = (req: Request, res: Response): boolean => {
  // Skip health checks and static files in production
  if (process.env.NODE_ENV === 'production') {
    return (
      req.url === '/health' ||
      req.url.startsWith('/uploads/') ||
      req.url.endsWith('.css') ||
      req.url.endsWith('.js') ||
      req.url.endsWith('.ico')
    );
  }

  return false;
};

// Development request logger
export const devRequestLogger = morgan(developmentFormat, {
  stream,
  skip,
});

// Production request logger
export const prodRequestLogger = morgan(jsonFormat, {
  stream,
  skip,
});

// Main request logger based on environment
export const requestLogger =
  process.env.NODE_ENV === 'production' ? prodRequestLogger : devRequestLogger;

// Security-focused request logger
export const securityLogger = morgan(
  (tokens, req: Request, res: Response) => {
    const logData = {
      timestamp: new Date().toISOString(),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: parseInt(tokens.status(req, res)) || 0,
      ip: tokens['real-ip'](req, res),
      userAgent: req.get('User-Agent'),
      authorization: req.get('Authorization') ? 'Bearer [HIDDEN]' : 'none',
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length'),
      referer: tokens.referrer(req, res),
      userId: tokens['user-id'](req, res),
      businessId: tokens['business-id'](req, res),
      suspicious: false,
    };

    // Flag suspicious requests
    if (logData.status === 401 || logData.status === 403) {
      logData.suspicious = true;
    }

    // Flag potential attacks
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /exec\(/i, // Code injection
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(req.url))) {
      logData.suspicious = true;
    }

    return JSON.stringify(logData);
  },
  {
    stream: {
      write: (message: string) => {
        try {
          const logData = JSON.parse(message.trim());

          if (logData.suspicious || logData.status >= 400) {
            logger.warn('Security Alert', logData);
          }
        } catch (error) {
          // Ignore parsing errors
        }
      },
    },
    skip: (req: Request) => req.url === '/health',
  },
);

// API access logger (for analytics)
export const apiAccessLogger = morgan(
  (tokens, req: Request, res: Response) => {
    // Only log API endpoints
    if (!req.url.startsWith('/api/')) {
      return null;
    }

    const logData = {
      timestamp: new Date().toISOString(),
      endpoint: `${tokens.method(req, res)} ${req.route?.path || req.url}`,
      status: parseInt(tokens.status(req, res)) || 0,
      responseTime: parseFloat(tokens['response-time'](req, res)) || 0,
      userId: tokens['user-id'](req, res),
      businessId: tokens['business-id'](req, res),
      apiVersion: req.get('api-version') || 'v1',
    };

    return JSON.stringify(logData);
  },
  {
    stream: {
      write: (message: string) => {
        try {
          const logData = JSON.parse(message.trim());
          logger.info('API Access', logData);
        } catch (error) {
          // Ignore parsing errors
        }
      },
    },
  },
);

// Error-only request logger
export const errorRequestLogger = morgan(jsonFormat, {
  stream: {
    write: (message: string) => {
      try {
        const logData = JSON.parse(message.trim());

        if (logData.status >= 400) {
          logger.error('HTTP Error', logData);
        }
      } catch (error) {
        logger.error('Request logging error', {
          error: error.message,
          message,
        });
      }
    },
  },
  skip: (req: Request, res: Response) => res.statusCode < 400,
});

// Custom request logger for specific routes
export const createRouteLogger = (routeName: string) => {
  return morgan(
    (tokens, req: Request, res: Response) => {
      const logData = {
        timestamp: new Date().toISOString(),
        route: routeName,
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: parseInt(tokens.status(req, res)) || 0,
        responseTime: parseFloat(tokens['response-time'](req, res)) || 0,
        userId: tokens['user-id'](req, res),
        businessId: tokens['business-id'](req, res),
        ip: tokens['real-ip'](req, res),
      };

      return JSON.stringify(logData);
    },
    {
      stream: {
        write: (message: string) => {
          try {
            const logData = JSON.parse(message.trim());
            logger.info(`Route: ${routeName}`, logData);
          } catch (error) {
            logger.info(message.trim());
          }
        },
      },
    },
  );
};

// Slow request logger
export const slowRequestLogger = morgan(jsonFormat, {
  stream: {
    write: (message: string) => {
      try {
        const logData = JSON.parse(message.trim());

        if (logData.responseTime > 1000) {
          // Log requests slower than 1 second
          logger.warn('Slow Request Detected', logData);
        }
      } catch (error) {
        // Ignore parsing errors
      }
    },
  },
  skip: (req: Request, res: Response) => {
    const responseTime = parseFloat(res.get('X-Response-Time') || '0');
    return responseTime <= 1000;
  },
});

// File upload logger
export const uploadLogger = morgan(
  (tokens, req: Request, res: Response) => {
    const logData = {
      timestamp: new Date().toISOString(),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: parseInt(tokens.status(req, res)) || 0,
      contentLength: req.get('Content-Length'),
      contentType: req.get('Content-Type'),
      userId: tokens['user-id'](req, res),
      businessId: tokens['business-id'](req, res),
      ip: tokens['real-ip'](req, res),
      files: (req as any).files ? Object.keys((req as any).files).length : 0,
    };

    return JSON.stringify(logData);
  },
  {
    stream: {
      write: (message: string) => {
        try {
          const logData = JSON.parse(message.trim());
          logger.info('File Upload', logData);
        } catch (error) {
          logger.info(message.trim());
        }
      },
    },
    skip: (req: Request) =>
      !req.get('Content-Type')?.includes('multipart/form-data'),
  },
);

// Database operation logger (to be used with database queries)
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  userId?: number,
  businessId?: number,
) => {
  logger.info('Database Operation', {
    timestamp: new Date().toISOString(),
    operation,
    table,
    duration: `${duration}ms`,
    userId,
    businessId,
  });
};

// Authentication event logger
export const logAuthenticationEvent = (
  event: string,
  success: boolean,
  userId?: number,
  ip?: string,
  userAgent?: string,
  details?: any,
) => {
  const logLevel = success ? 'info' : 'warn';

  logger[logLevel]('Authentication Event', {
    timestamp: new Date().toISOString(),
    event,
    success,
    userId,
    ip,
    userAgent,
    ...details,
  });
};

// Business operation logger
export const logBusinessOperation = (
  operation: string,
  businessId: number,
  userId: number,
  details?: any,
) => {
  logger.info('Business Operation', {
    timestamp: new Date().toISOString(),
    operation,
    businessId,
    userId,
    ...details,
  });
};

// Structured request logger with custom fields
export const structuredRequestLogger = (customFields: any = {}) => {
  return morgan(
    (tokens, req: Request, res: Response) => {
      const baseLogData = {
        timestamp: new Date().toISOString(),
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: parseInt(tokens.status(req, res)) || 0,
        responseTime: parseFloat(tokens['response-time'](req, res)) || 0,
        ip: tokens['real-ip'](req, res),
        userId: tokens['user-id'](req, res),
        businessId: tokens['business-id'](req, res),
        userAgent: req.get('User-Agent'),
        ...customFields,
      };

      return JSON.stringify(baseLogData);
    },
    {
      stream,
    },
  );
};

// Export utility functions
export const requestLoggerUtils = {
  logDatabaseOperation,
  logAuthenticationEvent,
  logBusinessOperation,
  createRouteLogger,
};

// Request correlation ID middleware (adds unique ID to each request)
export const addRequestId = (req: Request, res: Response, next: Function) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  (req as any).id = requestId;
  res.set('X-Request-ID', requestId);
  next();
};

// Combined logging middleware for complete request tracking
export const comprehensiveLogger = [
  addRequestId,
  requestLogger,
  securityLogger,
  apiAccessLogger,
];

// Conditional loggers based on environment
export const conditionalLoggers = {
  development: [devRequestLogger],
  test: [], // No logging in test environment
  production: [prodRequestLogger, securityLogger, errorRequestLogger],
};

// Get appropriate loggers for current environment
export const getEnvironmentLoggers = () => {
  const env = process.env.NODE_ENV || 'development';
  return (
    conditionalLoggers[env as keyof typeof conditionalLoggers] ||
    conditionalLoggers.development
  );
};
