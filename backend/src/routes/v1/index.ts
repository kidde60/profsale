// routes/v1/index.ts - API v1 routes
import { Router } from 'express';
import authRoutes from '../auth.routes';
import usersRoutes from '../user.routes';
import productsRoutes from '../product.routes';
import salesRoutes from '../sales.routes';
import customersRoutes from '../customer.routes';
import dashboardRoutes from '../dashboard.routes';
import businessRoutes from '../business.routes';
import expensesRoutes from '../expenses.routes';
import reportsRoutes from '../reports.routes';
import staffRoutes from '../staff.routes';
import subscriptionRoutes from '../subscription.routes';

const router = Router();

// Mount all v1 routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/products', productsRoutes);
router.use('/sales', salesRoutes);
router.use('/customers', customersRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/business', businessRoutes);
router.use('/expenses', expensesRoutes);
router.use('/reports', reportsRoutes);
router.use('/staff', staffRoutes);
router.use('/subscriptions', subscriptionRoutes);

// API version info
router.get('/', (req, res) => {
  res.json({
    version: 'v1',
    status: 'active',
    deprecated: false,
    documentation: '/api/v1/docs',
  });
});

export default router;
