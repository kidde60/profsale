// services/syncService.ts - Offline-first synchronization service
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';
import { localStorageService } from './localStorageService';
import { productService } from './productService';
import { networkService } from './networkService';
import { Alert } from 'react-native';

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
    console.log('Sync service initialized', { deviceId: this.deviceId });
    
    // Perform initial sync of products
    await this.initialProductSync();
  }

  private async initialProductSync() {
    try {
      if (networkService.isNetworkAvailable()) {
        const response = await productService.getProducts();
        const products = response?.data || response || [];
        if (Array.isArray(products)) {
          await localStorageService.cacheProducts(products);
          console.log('Products cached locally');
        } else {
          console.warn('Products response is not an array:', products);
        }
      }
    } catch (error) {
      console.error('Failed to cache products:', error);
    }
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
      console.log('Change queued for sync', { type: change.type, entity: change.entity });
    } catch (error) {
      console.error('Failed to queue change', { error });
    }
  }

  private async getPendingChanges(): Promise<SyncChange[]> {
    try {
      const changes = await AsyncStorage.getItem('pendingChanges');
      return changes ? JSON.parse(changes) : [];
    } catch (error) {
      console.error('Failed to get pending changes', { error });
      return [];
    }
  }

  async syncNow(): Promise<{ success: boolean; synced: number; conflicts: number }> {
    if (this.isSyncing) {
      console.warn('Sync already in progress');
      return { success: false, synced: 0, conflicts: 0 };
    }

    if (!networkService.isNetworkAvailable()) {
      console.warn('Cannot sync: offline');
      return { success: false, synced: 0, conflicts: 0 };
    }

    this.isSyncing = true;

    try {
      // Sync local product changes
      await this.syncLocalProducts();
      
      // Sync pending API changes
      const pendingChanges = await this.getPendingChanges();
      if (pendingChanges.length === 0) {
        console.info('No pending changes to sync');
        return { success: true, synced: 0, conflicts: 0 };
      }

      console.info('Starting sync', { pendingChanges: pendingChanges.length });

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

        console.info('Sync completed', {
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
      console.error('Sync failed', { error });
      return { success: false, synced: 0, conflicts: 0 };
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncLocalProducts() {
    console.log('Syncing local product changes...');
    const pendingChanges = await localStorageService.getPendingChanges();
    const productChanges = pendingChanges.filter(c => c.type === 'product');

    if (productChanges.length === 0) {
      console.log('No local product changes to sync');
      return;
    }

    const sortedChanges = productChanges.sort((a, b) => a.timestamp - b.timestamp);

    for (const change of sortedChanges) {
      try {
        if (change.action === 'create') {
          await this.syncCreateProduct(change);
        } else if (change.action === 'update') {
          await this.syncUpdateProduct(change);
        } else if (change.action === 'delete') {
          await this.syncDeleteProduct(change);
        }

        await localStorageService.markAsSynced('product', change.id);
      } catch (error) {
        console.error(`Failed to sync change: ${change.action} for product ${change.id}`, error);
      }
    }

    await localStorageService.clearPendingChanges();
    await this.refreshLocalCache();
    console.log('Local product sync completed');
  }

  private async syncCreateProduct(change: any) {
    const localProduct = await localStorageService.getProduct(change.id);
    if (!localProduct) return;

    try {
      const createdProduct = await productService.createProduct({
        name: localProduct.name,
        description: localProduct.description,
        barcode: localProduct.barcode,
        buying_price: localProduct.buying_price,
        selling_price: localProduct.selling_price,
        current_stock: localProduct.current_stock,
        min_stock_level: localProduct.min_stock_level,
        unit: localProduct.unit,
        category_id: localProduct.category_id,
      });

      await localStorageService.updateLocalId(change.id, createdProduct.id);
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('duplicate')) {
        console.log('Product already exists on server, fetching...');
        const response = await productService.getProducts();
        const products = response.data || response;
        const existingProduct = products.find((p: any) => p.barcode === localProduct.barcode);
        if (existingProduct) {
          await localStorageService.updateLocalId(change.id, existingProduct.id);
        }
      } else {
        throw error;
      }
    }
  }

  private async syncUpdateProduct(change: any) {
    const localProduct = await localStorageService.getProduct(change.id);
    if (!localProduct) return;

    if (change.id > 0) {
      await productService.updateProduct(localProduct.id, {
        name: localProduct.name,
        description: localProduct.description,
        barcode: localProduct.barcode,
        buying_price: localProduct.buying_price,
        selling_price: localProduct.selling_price,
        current_stock: localProduct.current_stock,
        min_stock_level: localProduct.min_stock_level,
        unit: localProduct.unit,
        category_id: localProduct.category_id,
      });
    }
  }

  private async syncDeleteProduct(change: any) {
    if (change.id > 0) {
      await productService.deleteProduct(change.id);
    }
  }

  private async refreshLocalCache() {
    try {
      const response = await productService.getProducts();
      const products = response.data || response;
      await localStorageService.cacheProducts(products);
      console.log('Local cache refreshed');
    } catch (error) {
      console.error('Failed to refresh local cache:', error);
    }
  }

  private async processServerChanges(changes: any) {
    await AsyncStorage.setItem('serverChanges', JSON.stringify(changes));
    console.info('Server changes stored', { changesCount: Object.keys(changes).length });
  }

  async getServerChanges(): Promise<any> {
    try {
      const changes = await AsyncStorage.getItem('serverChanges');
      return changes ? JSON.parse(changes) : null;
    } catch (error) {
      console.error('Failed to get server changes', { error });
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
        console.debug('Auto-sync triggered');
      }
      this.syncNow();
    }, intervalMs) as unknown as NodeJS.Timeout;
    console.info('Auto-sync started', { interval: intervalMs });
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.info('Auto-sync stopped');
    }
  }

  async getSyncStatus(): Promise<{ lastSync: string | null; pendingChanges: number }> {
    const pendingChanges = await this.getPendingChanges();
    const localChanges = await localStorageService.getPendingChanges();
    return {
      lastSync: this.lastSyncTimestamp,
      pendingChanges: pendingChanges.length + localChanges.length,
    };
  }

  isOnline(): boolean {
    return networkService.isNetworkAvailable();
  }
}

export const syncService = new SyncService();
export default syncService;
