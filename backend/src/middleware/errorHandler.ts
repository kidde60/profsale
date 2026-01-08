// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

// Common error responses
export const createError = {
  validation: (message: string, details?: any) =>
    new AppError(message, 400, {
      type: ErrorTypes.VALIDATION_ERROR,
      ...details,
    }),

  authentication: (message: string = 'Authentication required') =>
    new AppError(message, 401, { type: ErrorTypes.AUTHENTICATION_ERROR }),

  authorization: (message: string = 'Insufficient permissions') =>
    new AppError(message, 403, { type: ErrorTypes.AUTHORIZATION_ERROR }),

  notFound: (resource: string = 'Resource') =>
    new AppError(`${resource} not found`, 404, {
      type: ErrorTypes.NOT_FOUND_ERROR,
    }),

  conflict: (message: string, details?: any) =>
    new AppError(message, 409, { type: ErrorTypes.CONFLICT_ERROR, ...details }),

  businessLogic: (message: string, details?: any) =>
    new AppError(message, 422, {
      type: ErrorTypes.BUSINESS_LOGIC_ERROR,
      ...details,
    }),

  rateLimit: (message: string = 'Too many requests') =>
    new AppError(message, 429, { type: ErrorTypes.RATE_LIMIT_ERROR }),

  internal: (message: string = 'Internal server error') =>
    new AppError(message, 500, { type: ErrorTypes.INTERNAL_ERROR }),
};

// Database error handler
export const handleDatabaseError = (error: any): AppError => {
  // MySQL specific error handling
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      const field = error.sqlMessage?.match(/for key '(\w+)'/)?.[1] || 'field';
      return createError.conflict(`Duplicate entry for ${field}`, {
        field,
        value: error.sqlMessage,
      });

    case 'ER_NO_REFERENCED_ROW_2':
      return createError.validation('Referenced record does not exist', {
        constraint: error.sqlMessage,
      });

    case 'ER_ROW_IS_REFERENCED_2':
      return createError.conflict(
        'Cannot delete record that is referenced by other records',
        {
          constraint: error.sqlMessage,
        },
      );

    case 'ER_DATA_TOO_LONG':
      return createError.validation('Data too long for field', {
        field: error.sqlMessage?.match(/for column '(\w+)'/)?.[1],
      });

    case 'ER_BAD_NULL_ERROR':
      const nullField = error.sqlMessage?.match(/Column '(\w+)'/)?.[1];
      return createError.validation(`${nullField} cannot be null`);

    case 'ECONNREFUSED':
    case 'ENOTFOUND':
    case 'ECONNRESET':
      return createError.internal('Database connection failed');

    default:
      logger.error('Unhandled database error:', error);
      return createError.internal('Database operation failed');
  }
};

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let error = err;

  // Convert non-AppError to AppError
  if (!(error instanceof AppError)) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      error = createError.validation('Validation failed', {
        details: error.message,
      });
    } else if (error.name === 'JsonWebTokenError') {
      error = createError.authentication('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      error = createError.authentication('Token expired');
    } else if (error.name === 'MulterError') {
      error = createError.validation('File upload error', {
        details: error.message,
      });
    } else if ((error as any).code?.startsWith('ER_')) {
      error = handleDatabaseError(error);
    } else {
      error = createError.internal(error.message);
    }
  }

  const appError = error as AppError;

  // Log error
  const logData = {
    message: appError.message,
    statusCode: appError.statusCode,
    details: appError.details,
    stack: appError.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    user: req.user?.id,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  };

  if (appError.statusCode >= 500) {
    logger.error('Server error:', logData);
  } else {
    logger.warn('Client error:', logData);
  }

  // Prepare error response
  const errorResponse: any = {
    success: false,
    message: appError.message,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  };

  // Add details in development or for specific error types
  if (process.env.NODE_ENV === 'development' || appError.details) {
    errorResponse.details = appError.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = appError.stack;
  }

  // Add error ID for tracking
  errorResponse.errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.status(appError.statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};

// Business logic error helpers
export const businessErrors = {
  insufficientStock: (
    productName: string,
    available: number,
    requested: number,
  ) =>
    createError.businessLogic(`Insufficient stock for ${productName}`, {
      productName,
      available,
      requested,
      shortage: requested - available,
    }),

  invalidSale: (reason: string, details?: any) =>
    createError.businessLogic(`Invalid sale: ${reason}`, details),

  subscriptionLimitExceeded: (limit: string, current: number, max: number) =>
    createError.businessLogic(`Subscription limit exceeded for ${limit}`, {
      limit,
      current,
      max,
    }),

  businessInactive: () =>
    createError.authorization('Business account is inactive'),

  employeeNotFound: (employeeId: number) =>
    createError.notFound(`Employee with ID ${employeeId} not found`),

  productNotFound: (productId: number) =>
    createError.notFound(`Product with ID ${productId} not found`),

  customerNotFound: (customerId: number) =>
    createError.notFound(`Customer with ID ${customerId} not found`),

  saleNotFound: (saleId: number) =>
    createError.notFound(`Sale with ID ${saleId} not found`),

  cannotCancelSale: (reason: string) =>
    createError.businessLogic(`Cannot cancel sale: ${reason}`),

  invalidDateRange: () =>
    createError.validation(
      'Invalid date range: end date must be after start date',
    ),

  invalidPricing: () =>
    createError.validation('Selling price must be greater than buying price'),

  duplicateBarcode: (barcode: string) =>
    createError.conflict(`Product with barcode ${barcode} already exists`),
};

// Request timeout handler
export const timeoutHandler = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      const error = createError.internal('Request timeout');
      next(error);
    }, timeout);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};

// Error monitoring and alerting
export const errorMonitor = {
  trackError: (error: AppError, req: Request) => {
    // Track error metrics for monitoring
    const errorData = {
      type: error.details?.type || 'UNKNOWN',
      statusCode: error.statusCode,
      message: error.message,
      path: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
      businessId: req.user?.businessId,
      timestamp: new Date(),
    };

    // In production, you would send this to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // monitoringService.trackError(errorData);
    }
  },

  shouldAlert: (error: AppError): boolean => {
    // Define conditions for alerting
    return (
      error.statusCode >= 500 ||
      error.details?.type === ErrorTypes.DATABASE_ERROR ||
      error.message.includes('timeout')
    );
  },
};
