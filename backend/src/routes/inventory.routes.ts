import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken as any);

// Placeholder route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Inventory routes - Coming soon',
    timestamp: new Date().toISOString(),
  });
});

export default router;
