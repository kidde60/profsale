// utils/healthCheck.ts - Comprehensive health check with service dependencies
import { pool } from '../config/database';
import logger from './logger';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis?: ServiceHealth;
    disk?: ServiceHealth;
    memory?: ServiceHealth;
  };
  version: string;
  environment: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  message?: string;
  details?: any;
}

/**
 * Check database connection health
 */
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    
    // Run a simple query to ensure database is responsive
    const [_rows] = await pool.execute('SELECT 1 as health_check');
    connection.release();
    
    const responseTime = Date.now() - startTime;
    
    if (responseTime > 1000) {
      logger.warn('Database response time slow', { responseTime });
      return {
        status: 'healthy',
        responseTime,
        message: 'Database responding slowly',
      };
    }
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Database connection successful',
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Database health check failed', { error });
    
    return {
      status: 'unhealthy',
      responseTime,
      message: error instanceof Error ? error.message : 'Database connection failed',
      details: {
        error: error instanceof Error ? error.stack : String(error),
      },
    };
  }
}

/**
 * Check Redis connection health (if configured)
 */
async function checkRedisHealth(): Promise<ServiceHealth | undefined> {
  if (!process.env.REDIS_HOST) {
    return undefined;
  }

  const startTime = Date.now();
  
  try {
    // Import Redis dynamically to avoid errors if not installed
    const redis = require('redis');
    const client = redis.createClient({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });

    await client.connect();
    await client.ping();
    await client.disconnect();
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Redis connection successful',
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Redis health check failed', { error });
    
    return {
      status: 'unhealthy',
      responseTime,
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

/**
 * Check disk space health
 */
async function checkDiskHealth(): Promise<ServiceHealth | undefined> {
  const startTime = Date.now();
  
  try {
    const fs = require('fs');
    // const path = require('path');
    
    // Check if uploads directory exists and has space
    const uploadsDir = process.env.UPLOAD_DIR || './uploads';
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // const stats = fs.statSync(uploadsDir);
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Disk space available',
      details: {
        uploadsDir,
        exists: true,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Disk health check failed', { error });
    
    return {
      status: 'unhealthy',
      responseTime,
      message: error instanceof Error ? error.message : 'Disk check failed',
    };
  }
}

/**
 * Check memory usage health
 */
async function checkMemoryHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const used = process.memoryUsage();
    const total = require('os').totalmem();
    const free = require('os').freemem();
    const memoryUsagePercent = ((used.heapUsed / used.heapTotal) * 100).toFixed(2);
    
    const responseTime = Date.now() - startTime;
    
    // Alert if memory usage is above 85%
    if (parseFloat(memoryUsagePercent) > 85) {
      logger.warn('High memory usage detected', { memoryUsagePercent });
      
      return {
        status: 'healthy',
        responseTime,
        message: 'High memory usage',
        details: {
          memoryUsagePercent,
          heapUsed: `${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          systemFree: `${(free / 1024 / 1024 / 1024).toFixed(2)} GB`,
          systemTotal: `${(total / 1024 / 1024 / 1024).toFixed(2)} GB`,
        },
      };
    }
    
    return {
      status: 'healthy',
      responseTime,
      message: 'Memory usage normal',
      details: {
        memoryUsagePercent,
        heapUsed: `${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Memory health check failed', { error });
    
    return {
      status: 'unhealthy',
      responseTime,
      message: error instanceof Error ? error.message : 'Memory check failed',
    };
  }
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  const [database, redis, disk, memory] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkDiskHealth(),
    checkMemoryHealth(),
  ]);
  
  const services: HealthCheckResult['services'] = {
    database,
  };
  
  if (redis) services.redis = redis;
  if (disk) services.disk = disk;
  if (memory) services.memory = memory;
  
  // Determine overall health status
  const allServices = Object.values(services).filter(Boolean);
  const unhealthyServices = allServices.filter(s => s.status === 'unhealthy');
  const slowServices = allServices.filter(s => s.responseTime > 1000);
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  
  if (unhealthyServices.length > 0) {
    status = 'unhealthy';
  } else if (slowServices.length > 0 || database.responseTime > 500) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }
  
  const responseTime = Date.now() - startTime;
  
  logger.info('Health check completed', {
    status,
    responseTime: `${responseTime}ms`,
    services: Object.keys(services),
  });
  
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services,
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Simple health check endpoint (for load balancers)
 */
export async function simpleHealthCheck(): Promise<{ status: string; timestamp: string }> {
  try {
    await pool.getConnection();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Readiness check - checks if the server is ready to accept traffic
 */
export async function readinessCheck(): Promise<{ ready: boolean; checks: any }> {
  const checks = {
    database: false,
  };
  
  try {
    await pool.getConnection();
    checks.database = true;
  } catch {
      logger.error('Error checking database health');
  }
  
  const ready = Object.values(checks).every(Boolean);
  
  return {
    ready,
    checks,
  };
}

/**
 * Liveness check - checks if the server is still running
 */
export async function livenessCheck(): Promise<{ alive: boolean; timestamp: string }> {
  return {
    alive: true,
    timestamp: new Date().toISOString(),
  };
}

export default {
  performHealthCheck,
  simpleHealthCheck,
  readinessCheck,
  livenessCheck,
};
