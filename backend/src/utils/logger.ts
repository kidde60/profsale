// utils/logger.ts - Simple working version
import winston from 'winston';
import path from 'path';

// Simple logger configuration that works with your current setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'prof-sale-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// Add file transports only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Create logs directory if it doesn't exist
  const fs = require('fs');
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Add file transports
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
  );
}

export default logger;
