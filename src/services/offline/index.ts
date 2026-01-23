/**
 * Offline Services Index
 * Export all offline-related services
 */

// Use SQLite-based storage for better performance with large datasets
export { offlineStorage, STORAGE_KEYS } from './OfflineStorageSQLite';
export type { PendingSale, CachedCredentials } from './OfflineStorageSQLite';

export { database } from './Database';

export { syncManager } from './SyncManager';
export type { SyncResult, SyncProgress } from './SyncManager';
