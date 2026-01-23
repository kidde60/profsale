/**
 * Sync Manager Service
 * Handles syncing pending offline operations when connection is restored
 */

import { offlineStorage, PendingSale } from './OfflineStorageSQLite';
import { salesService, CreateSaleData } from '../salesService';
import { productService } from '../productService';
import { customerService } from '../customerService';
import { isOnline } from '../../hooks/useNetworkStatus';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export interface SyncProgress {
  total: number;
  completed: number;
  current: string;
}

type SyncProgressCallback = (progress: SyncProgress) => void;

class SyncManager {
  private isSyncing = false;
  private syncListeners: Set<(syncing: boolean) => void> = new Set();
  private progressListeners: Set<SyncProgressCallback> = new Set();

  /**
   * Add listener for sync state changes
   */
  addSyncListener(listener: (syncing: boolean) => void) {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  /**
   * Add listener for sync progress
   */
  addProgressListener(listener: SyncProgressCallback) {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private notifySyncState(syncing: boolean) {
    this.syncListeners.forEach(listener => listener(syncing));
  }

  private notifyProgress(progress: SyncProgress) {
    this.progressListeners.forEach(listener => listener(progress));
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Sync all pending operations
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ['Sync already in progress'],
      };
    }

    const online = await isOnline();
    if (!online) {
      console.log('Cannot sync - device is offline');
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ['Device is offline'],
      };
    }

    this.isSyncing = true;
    this.notifySyncState(true);

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Sync pending sales
      const salesResult = await this.syncPendingSales();
      result.synced += salesResult.synced;
      result.failed += salesResult.failed;
      result.errors.push(...salesResult.errors);

      // Refresh cached data from server
      await this.refreshCachedData();

      // Update last sync time
      await offlineStorage.setLastSyncTime();

      result.success = result.failed === 0;
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message || 'Unknown sync error');
    } finally {
      this.isSyncing = false;
      this.notifySyncState(false);
    }

    console.log('Sync completed:', result);
    return result;
  }

  /**
   * Sync pending sales to server
   */
  async syncPendingSales(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    const pendingSales = await offlineStorage.getPendingSales();

    if (pendingSales.length === 0) {
      console.log('No pending sales to sync');
      return result;
    }

    console.log(`Syncing ${pendingSales.length} pending sales...`);

    for (let i = 0; i < pendingSales.length; i++) {
      const sale = pendingSales[i];

      this.notifyProgress({
        total: pendingSales.length,
        completed: i,
        current: `Syncing sale ${i + 1} of ${pendingSales.length}`,
      });

      try {
        // Skip if too many failed attempts
        if (sale.attempts >= 5) {
          console.log(
            `Skipping sale ${sale.localId} - too many failed attempts`,
          );
          result.failed++;
          result.errors.push(`Sale ${sale.localId} exceeded retry limit`);
          await offlineStorage.updatePendingSaleStatus(
            sale.localId,
            'failed',
            'Exceeded retry limit',
          );
          continue;
        }

        // Update status to syncing
        await offlineStorage.updatePendingSaleStatus(sale.localId, 'syncing');

        // Try to create the sale on server - cast payment method to proper type
        const saleData: CreateSaleData = {
          ...sale.data,
          paymentMethod: sale.data.paymentMethod as
            | 'cash'
            | 'mobile_money'
            | 'card'
            | 'credit',
        };
        await salesService.createSale(saleData);

        // Remove from pending queue on success
        await offlineStorage.removePendingSale(sale.localId);
        result.synced++;

        console.log(`Successfully synced sale ${sale.localId}`);
      } catch (error: any) {
        console.error(`Failed to sync sale ${sale.localId}:`, error);
        await offlineStorage.updatePendingSaleStatus(
          sale.localId,
          'failed',
          error.message,
        );
        result.failed++;
        result.errors.push(
          `Sale ${sale.localId}: ${error.message || 'Unknown error'}`,
        );
      }
    }

    this.notifyProgress({
      total: pendingSales.length,
      completed: pendingSales.length,
      current: 'Sync completed',
    });

    return result;
  }

  /**
   * Refresh cached data from server
   */
  async refreshCachedData(): Promise<void> {
    try {
      const online = await isOnline();
      if (!online) return;

      console.log('Refreshing cached data...');

      // Refresh products
      try {
        const productsResponse = await productService.getProducts({});
        const products = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : (productsResponse.data as any)?.products || [];
        await offlineStorage.cacheProducts(products);
      } catch (error) {
        console.error('Failed to refresh products:', error);
      }

      // Refresh customers
      try {
        const customersResponse = await customerService.getCustomers({});
        const customers = Array.isArray(customersResponse.data)
          ? customersResponse.data
          : (customersResponse.data as any)?.customers || [];
        await offlineStorage.cacheCustomers(customers);
      } catch (error) {
        console.error('Failed to refresh customers:', error);
      }

      console.log('Cached data refreshed');
    } catch (error) {
      console.error('Error refreshing cached data:', error);
    }
  }

  /**
   * Initial data cache after login
   */
  async cacheInitialData(): Promise<void> {
    console.log('Caching initial data for offline use...');
    await this.refreshCachedData();
  }

  /**
   * Get sync status summary
   */
  async getSyncStatus(): Promise<{
    pendingSales: number;
    lastSyncTime: string | null;
    isSyncing: boolean;
  }> {
    const pendingSales = await offlineStorage.getPendingSalesCount();
    const lastSyncTime = await offlineStorage.getLastSyncTime();

    return {
      pendingSales,
      lastSyncTime,
      isSyncing: this.isSyncing,
    };
  }
}

export const syncManager = new SyncManager();
export default syncManager;
