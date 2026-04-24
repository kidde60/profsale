// routes/sync.routes.ts - Offline-first synchronization routes
import { Router } from 'express';
import { syncData, getSyncStatus, resolveConflict } from '../controllers/sync.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All sync routes require authentication
router.use(authenticate);

// Sync client data with server
router.post('/sync', syncData);

// Get sync status for a device
router.get('/status', getSyncStatus);

// Resolve sync conflicts
router.post('/resolve-conflict', resolveConflict);

export default router;
