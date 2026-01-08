import { Request, Response, NextFunction } from 'express';
import { logApiRequest, logPerformanceMetric } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

// Performance monitoring middleware
export const performanceMonitor = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Add timing data to response headers
  res.set('X-Response-Time-Start', startTime.toString());

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (this: Response, ...args: any[]) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const endMemory = process.memoryUsage();

    // Add performance headers
    res.set('X-Response-Time', `${responseTime}ms`);
    res.set(
      'X-Memory-Usage',
      `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
    );

    // Log API request
    logApiRequest(req, res, responseTime);

    // Log performance metrics for slow requests
    if (responseTime > 1000) {
      logPerformanceMetric('slow_request', responseTime, 'ms', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        userId: req.user?.id,
        businessId: req.user?.business_id,
        memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
      });
    }

    // Log memory usage if significant
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    if (memoryDelta > 50 * 1024 * 1024) {
      // 50MB
      logPerformanceMetric('high_memory_usage', memoryDelta, 'bytes', {
        method: req.method,
        path: req.originalUrl,
        responseTime,
        userId: req.user?.id,
        businessId: req.user?.business_id,
      });
    }

    // Call original end method
    originalEnd.apply(this, args);
  };

  next();
};

// Request size monitoring middleware
export const requestSizeMonitor = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const contentLength = parseInt(req.get('content-length') || '0');

  if (contentLength > 10 * 1024 * 1024) {
    // 10MB
    logPerformanceMetric('large_request', contentLength, 'bytes', {
      method: req.method,
      path: req.originalUrl,
      contentType: req.get('content-type'),
      ip: req.ip,
    });
  }

  next();
};

// Database query performance tracking
export const trackDatabaseQuery = (
  query: string,
  duration: number,
  rowsAffected?: number,
): void => {
  if (duration > 1000) {
    // Log slow queries (>1s)
    logPerformanceMetric('slow_database_query', duration, 'ms', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      rowsAffected,
    });
  }
};

// Memory usage monitoring
let lastMemoryCheck = Date.now();
let memoryCheckInterval: NodeJS.Timeout;

const checkMemoryUsage = (): void => {
  const now = Date.now();
  if (now - lastMemoryCheck > 60000) {
    // Check every minute
    const memUsage = process.memoryUsage();
    const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    logPerformanceMetric('memory_usage', memoryMB, 'MB', {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    });

    // Warn if memory usage is high
    if (memoryMB > 512) {
      // 512MB threshold
      logPerformanceMetric('high_memory_warning', memoryMB, 'MB');
    }

    lastMemoryCheck = now;
  }
};

// Start memory monitoring
memoryCheckInterval = setInterval(checkMemoryUsage, 60000);

// CPU usage monitoring
const getCPUUsage = (): Promise<number> => {
  return new Promise(resolve => {
    const startUsage = process.cpuUsage();
    const startTime = Date.now();

    setTimeout(() => {
      const currentUsage = process.cpuUsage(startUsage);
      const currentTime = Date.now();
      const timeDiff = currentTime - startTime;

      // Calculate CPU percentage
      const cpuPercent =
        ((currentUsage.user + currentUsage.system) / 1000 / timeDiff) * 100;
      resolve(cpuPercent);
    }, 100);
  });
};

// CPU monitoring middleware
export const cpuMonitor = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const cpuUsage = await getCPUUsage();

  if (cpuUsage > 80) {
    // High CPU usage threshold
    logPerformanceMetric('high_cpu_usage', cpuUsage, 'percent', {
      method: req.method,
      path: req.originalUrl,
    });
  }

  next();
};

// Request queue monitoring
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 100;

export const requestQueueMonitor = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  activeRequests++;

  if (activeRequests > MAX_CONCURRENT_REQUESTS) {
    logPerformanceMetric('high_request_queue', activeRequests, 'count');

    res.status(503).json({
      success: false,
      message: 'Server is currently overloaded. Please try again later.',
      retryAfter: 30,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Decrease counter when request completes
  res.on('finish', () => {
    activeRequests--;
  });

  res.on('close', () => {
    activeRequests--;
  });

  next();
};

// Health metrics collection
export const collectHealthMetrics = () => {
  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      ...process.memoryUsage(),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    activeRequests,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null,
    freeMemory: Math.round(require('os').freemem() / 1024 / 1024),
    totalMemory: Math.round(require('os').totalmem() / 1024 / 1024),
    cpuCount: require('os').cpus().length,
  };
};

// Response compression monitoring
export const compressionMonitor = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const originalSend = res.send;

  res.send = function (this: Response, body: any) {
    const originalSize = Buffer.byteLength(body || '');
    const result = originalSend.call(this, body);

    // Check if response was compressed
    const encoding = this.get('Content-Encoding');
    if (encoding && originalSize > 1024) {
      // Only log for responses > 1KB
      logPerformanceMetric('response_compression', originalSize, 'bytes', {
        encoding,
        path: req.originalUrl,
        contentType: this.get('Content-Type'),
      });
    }

    return result;
  };

  next();
};

// API endpoint performance tracking
const endpointMetrics = new Map<
  string,
  {
    count: number;
    totalTime: number;
    maxTime: number;
    minTime: number;
    errors: number;
  }
>();

export const trackEndpointPerformance = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();
  const endpoint = `${req.method} ${req.route?.path || req.path}`;

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const isError = res.statusCode >= 400;

    let metrics = endpointMetrics.get(endpoint);
    if (!metrics) {
      metrics = {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        minTime: Infinity,
        errors: 0,
      };
      endpointMetrics.set(endpoint, metrics);
    }

    metrics.count++;
    metrics.totalTime += responseTime;
    metrics.maxTime = Math.max(metrics.maxTime, responseTime);
    metrics.minTime = Math.min(metrics.minTime, responseTime);

    if (isError) {
      metrics.errors++;
    }

    // Log metrics for slow endpoints
    if (responseTime > 2000) {
      logPerformanceMetric('slow_endpoint', responseTime, 'ms', {
        endpoint,
        avgTime: Math.round(metrics.totalTime / metrics.count),
        errorRate: (metrics.errors / metrics.count) * 100,
      });
    }
  });

  next();
};

// Get endpoint performance summary
export const getEndpointMetrics = () => {
  const summary = Array.from(endpointMetrics.entries()).map(
    ([endpoint, metrics]) => ({
      endpoint,
      requests: metrics.count,
      avgResponseTime: Math.round(metrics.totalTime / metrics.count),
      maxResponseTime: metrics.maxTime,
      minResponseTime: metrics.minTime === Infinity ? 0 : metrics.minTime,
      errorRate: ((metrics.errors / metrics.count) * 100).toFixed(2) + '%',
    }),
  );

  return summary.sort((a, b) => b.avgResponseTime - a.avgResponseTime);
};

// Cleanup on process exit
process.on('SIGTERM', () => {
  clearInterval(memoryCheckInterval);
});

process.on('SIGINT', () => {
  clearInterval(memoryCheckInterval);
});

// Export performance utilities
export const performanceUtils = {
  trackDatabaseQuery,
  collectHealthMetrics,
  getEndpointMetrics,
  getCPUUsage,
};
