// routes/user.routes.ts - Simple working version
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// Get all users - simple version that works
router.get('/all', async (req: Request, res: Response) => {
  try {
    const [users] = await pool.execute<any[]>(
      'SELECT id, phone, email, first_name, last_name, is_verified, is_active, created_at FROM users WHERE is_active = TRUE',
    );

    res.status(200).json({
      success: true,
      data: {
        users: users,
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
});

// Health check for users endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Users endpoint is working',
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'User routes are working correctly',
    timestamp: new Date().toISOString(),
  });
});

export default router;
