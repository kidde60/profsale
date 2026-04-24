// services/syncService.ts - Offline-first synchronization service
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';
import logger from '../utils/logger';

export interface SyncChange {
  type: 'create' | 'update' | 'delete';
  entity: 'sales' | 'products' | 'customers' | 'expenses';
  data: any;
  timestamp: string;
}

class SyncService {
  private deviceId: string | null = null;
  private lastSyncTimestamp: string | null = null;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  async initialize() {
    this.deviceId = await this.getOrCreateDeviceId();
    this.lastSyncTimestamp = await AsyncStorage.getItem('lastSyncTimestamp');
    logger.info('Sync service initialized', { deviceId: this.deviceId });
  }

  private async getOrCreateDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  async queueChange(change: SyncChange) {
    try {
      const changes = await this.getPendingChanges();
      changes.push(change);
      await AsyncStorage.setItem('pendingChanges', JSON.stringify(changes));
      logger.info('Change queued for sync', { type: change.type, entity: change.entity });
    } catch (error) {
      logger.error('Failed to queue change', { error });
    }
  }

  private async getPendingChanges(): Promise<SyncChange[]> {
    try {
      const changes = await AsyncStorage.getItem('pendingChanges');
      return changes ? JSON.parse(changes) : [];
    } catch (error) {
      logger.error('Failed to get pending changes', { error });
      return [];
    }
  }

  async syncNow(): Promise<{ success: boolean; synced: number; conflicts: number }> {
    if (this.isSyncing) {
      logger.warn('Sync already in progress');
      return { success: false, synced: 0, conflicts: 0 };
    }

    this.isSyncing = true;

    try {
      const pendingChanges = await this.getPendingChanges();
      if (pendingChanges.length === 0) {
        logger.info('No pending changes to sync');
        return { success: true, synced: 0, conflicts: 0 };
      }

      logger.info('Starting sync', { pendingChanges: pendingChanges.length });

      const syncData = {
        deviceId: this.deviceId,
        lastSyncTimestamp: this.lastSyncTimestamp || new Date(0).toISOString(),
        changes: {
          sales: pendingChanges.filter(c => c.entity === 'sales').map(c => c.data),
          products: pendingChanges.filter(c => c.entity === 'products').map(c => c.data),
          customers: pendingChanges.filter(c => c.entity === 'customers').map(c => c.data),
          expenses: pendingChanges.filter(c => c.entity === 'expenses').map(c => c.data),
        },
      };

      const response = await apiClient.post('/sync/sync', syncData);

      if (response.data.success) {
        const { syncResults, serverChanges, syncTimestamp } = response.data.data;

        // Process server changes
        await this.processServerChanges(serverChanges);

        // Clear synced changes
        const syncedCount = pendingChanges.length;
        await AsyncStorage.setItem('pendingChanges', JSON.stringify([]));
        await AsyncStorage.setItem('lastSyncTimestamp', syncTimestamp);
        this.lastSyncTimestamp = syncTimestamp;

        logger.info('Sync completed', {
          synced: syncedCount,
          conflicts: syncResults.conflicts.length,
        });

        return {
          success: true,
          synced: syncedCount,
          conflicts: syncResults.conflicts.length,
        };
      }

      return { success: false, synced: 0, conflicts: 0 };
    } catch (error) {
      logger.error('Sync failed', { error });
      return { success: false, synced: 0, conflicts: 0 };
    } finally {
      this.isSyncing = false;
    }
  }

  private async processServerChanges(changes: any) {
    // Store server changes in local storage for the app to process
    await AsyncStorage.setItem('serverChanges', JSON.stringify(changes));
    logger.info('Server changes stored', { changesCount: Object.keys(changes).length });
  }

  async getServerChanges(): Promise<any> {
    try {
      const changes = await AsyncStorage.getItem('serverChanges');
      return changes ? JSON.parse(changes) : null;
    } catch (error) {
      logger.error('Failed to get server changes', { error });
      return null;
    }
  }

  async clearServerChanges() {
    await AsyncStorage.removeItem('serverChanges');
  }

  startAutoSync(intervalMs: number = 60000) {
    this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      if (__DEV__) {
        logger.debug('Auto-sync triggered');
      }
      this.syncNow();
    }, intervalMs) as unknown as NodeJS.Timeout;
    logger.info('Auto-sync started', { interval: intervalMs });
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Auto-sync stopped');
    }
  }

  async getSyncStatus(): Promise<{ lastSync: string | null; pendingChanges: number }> {
    const pendingChanges = await this.getPendingChanges();
    return {
      lastSync: this.lastSyncTimestamp,
      pendingChanges: pendingChanges.length,
    };
  }

  isOnline(): boolean {
    // In a real app, you'd use NetInfo to check network status
    return true;
  }
}

export const syncService = new SyncService();
export default syncService;
