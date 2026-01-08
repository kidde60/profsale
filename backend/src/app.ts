import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config();

// Import your existing database and logger
import { connectDatabase } from './config/database';
import logger from './utils/logger';

// Import routes
import usersRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/product.routes';
import salesRoutes from './routes/sales.routes';
import customersRoutes from './routes/customer.routes';
import dashboardRoutes from './routes/dashboard.routes';
import businessRoutes from './routes/business.routes'; // NEW: Business settings routes
import expensesRoutes from './routes/expenses.routes';
import reportsRoutes from './routes/reports.routes';
import staffRoutes from './routes/staff.routes';
import subscriptionRoutes from './routes/subscription.routes';

const app = express();
const PORT = process.env.PORT || 5000;
const env = process.env.NODE_ENV || 'development';

// Basic security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:8081',
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'api-version'],
  }),
);

// Compression
app.use(compression());

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false }));

// Custom middleware to handle text/plain requests that should be JSON
app.use((req, res, next) => {
  if (
    req.headers['content-type'] === 'text/plain;charset=UTF-8' &&
    req.method !== 'GET'
  ) {
    // Try to parse as JSON if it's a text/plain request with a body
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        if (body.trim()) {
          req.body = JSON.parse(body);
        }
      } catch (e) {
        console.log('Failed to parse text/plain body as JSON:', e);
      }
      next();
    });
  } else {
    next();
  }
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthStatus = {
    success: true,
    message: 'Prof Sale API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env,
    uptime: Math.floor(process.uptime()),
  };

  res.status(200).json(healthStatus);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Prof Sale API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health - API health check',
      '',
      '🔐 Authentication:',
      'POST /api/auth/register - User registration',
      'POST /api/auth/login - User login',
      'GET /api/auth/profile - Get user profile (requires auth)',
      '',
      '👥 Users:',
      'GET /api/users/all - Get all users',
      '',
      '📦 Products:',
      'GET /api/products - Get all products (with filters)',
      'POST /api/products - Create new product',
      'GET /api/products/:id - Get product by ID',
      'PUT /api/products/:id - Update product',
      'DELETE /api/products/:id - Delete product',
      'GET /api/products/categories/list - Get categories',
      'GET /api/products/search/barcode/:barcode - Search by barcode',
      '',
      '💰 Sales/POS:',
      'POST /api/sales - Create new sale',
      'GET /api/sales - Get all sales (with filters)',
      'GET /api/sales/:id - Get sale details',
      'PUT /api/sales/:id/cancel - Cancel/refund sale',
      'GET /api/sales/reports/daily - Daily sales report',
      'GET /api/sales/reports/analytics - Sales analytics',
      'GET /api/sales/:id/receipt - Generate receipt',
      '',
      '👥 Customers:',
      'GET /api/customers - Get all customers (with filters)',
      'POST /api/customers - Create new customer',
      'GET /api/customers/:id - Get customer details',
      'PUT /api/customers/:id - Update customer',
      'DELETE /api/customers/:id - Delete customer',
      'GET /api/customers/search/:query - Search customers',
      'GET /api/customers/:id/loyalty - Customer loyalty info',
      'GET /api/customers/analytics/dashboard - Customer analytics',
      '',
      '📊 Dashboard:',
      'GET /api/dashboard/overview - Main dashboard overview',
      'GET /api/dashboard/trends - Sales trends analysis',
      'GET /api/dashboard/metrics - Business KPIs and metrics',
      'GET /api/dashboard/alerts - Business alerts and notifications',
      'GET /api/dashboard/quick-stats - Quick statistics for widgets',
      '',
      '🏢 Business Settings:',
      'GET /api/business/profile - Get business profile',
      'PUT /api/business/profile - Update business profile',
      'GET /api/business/settings - Get all business settings',
      'PUT /api/business/settings - Update business settings',
      'GET /api/business/hours - Get business hours',
      'PUT /api/business/hours - Update business hours',
      'GET /api/business/receipt-templates - Get receipt templates',
      'POST /api/business/receipt-templates - Create receipt template',
      'GET /api/business/tax-configurations - Get tax configurations',
      'GET /api/business/payment-methods - Get payment methods',
      'PUT /api/business/payment-methods - Update payment methods',
      'GET /api/business/notifications - Get notification preferences',

      'GET /api/sales/:id - Get sale details',
      'PUT /api/sales/:id/cancel - Cancel/refund sale',
      'GET /api/sales/reports/daily - Daily sales report',
      'GET /api/sales/reports/analytics - Sales analytics',
      'GET /api/sales/:id/receipt - Generate receipt',
    ],
  });
});

// API routes
app.use('/api/auth', authRoutes); // Auth routes
app.use('/api/users', usersRoutes); // Users routes
app.use('/api/products', productsRoutes); // Products routes
app.use('/api/sales', salesRoutes); // Sales routes
app.use('/api/customers', customersRoutes); // Customer routes
app.use('/api/dashboard', dashboardRoutes); // Dashboard routes
app.use('/api/business', businessRoutes); // NEW: Business settings routes
app.use('/api/expenses', expensesRoutes); // Expenses routes
app.use('/api/reports', reportsRoutes); // Reports routes
app.use('/api/staff', staffRoutes); // Staff management routes
app.use('/api/subscriptions', subscriptionRoutes); // Subscription routes

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Basic error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(env === 'development' && { stack: err.stack }),
    });
  },
);

// Database connection and server startup
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await connectDatabase();
    console.log('✅ Database connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Prof Sale API server running on port ${PORT}`);
      console.log(`📊 Environment: ${env}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/test`);
      console.log(
        `📦 Products endpoints: http://localhost:${PORT}/api/products/test`,
      );
      console.log(
        `💰 Sales endpoints: http://localhost:${PORT}/api/sales/test`,
      );
      console.log(
        `👥 Customer endpoints: http://localhost:${PORT}/api/customers/test`,
      );
      console.log(`📚 API documentation: http://localhost:${PORT}/`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`📴 Received ${signal}. Starting graceful shutdown...`);

      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        console.error(
          '❌ Could not close connections in time, forcefully shutting down',
        );
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server only if not in test environment
if (env !== 'test') {
  startServer();
}

export default app;
