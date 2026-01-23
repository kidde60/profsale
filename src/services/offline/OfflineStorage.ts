/**
 * Offline Storage Service
 * Handles local data persistence for offline mode
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
export const STORAGE_KEYS = {
  // Auth
  CACHED_CREDENTIALS: '@offline_credentials',
  CACHED_USER: '@offline_user',
  AUTH_TOKEN: 'authToken',

  // Data Cache
  CACHED_PRODUCTS: '@offline_products',
  CACHED_CUSTOMERS: '@offline_customers',
  CACHED_CATEGORIES: '@offline_categories',

  // Pending Operations Queue
  PENDING_SALES: '@pending_sales',
  PENDING_CUSTOMERS: '@pending_customers',
  PENDING_STOCK_UPDATES: '@pending_stock_updates',

  // Sync State
  LAST_SYNC_TIME: '@last_sync_time',
  SYNC_IN_PROGRESS: '@sync_in_progress',
};

export interface PendingSale {
  id: string; // Local UUID
  data: any;
  createdAt: string;
  attempts: number;
  lastAttempt?: string;
}

export interface CachedCredentials {
  phone: string;
  passwordHash: string; // We'll store a hash, not plain text
  user: any;
  token: string;
  cachedAt: string;
}

class OfflineStorage {
  // ==================== CREDENTIALS ====================

  /**
   * Cache user credentials for offline login
   */
  async cacheCredentials(
    phone: string,
    password: string,
    user: any,
    token: string,
  ): Promise<void> {
    try {
      // Simple hash for offline verification (not for security, just verification)
      const passwordHash = await this.simpleHash(password);

      const credentials: CachedCredentials = {
        phone,
        passwordHash,
        user,
        token,
        cachedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHED_CREDENTIALS,
        JSON.stringify(credentials),
      );

      console.log('Credentials cached for offline login');
    } catch (error) {
      console.error('Error caching credentials:', error);
    }
  }

  /**
   * Verify offline credentials
   */
  async verifyOfflineCredentials(
    phone: string,
    password: string,
  ): Promise<{ valid: boolean; user?: any; token?: string }> {
    try {
      const cached = await AsyncStorage.getItem(
        STORAGE_KEYS.CACHED_CREDENTIALS,
      );

      if (!cached) {
        return { valid: false };
      }

      const credentials: CachedCredentials = JSON.parse(cached);
      const passwordHash = await this.simpleHash(password);

      if (
        credentials.phone === phone &&
        credentials.passwordHash === passwordHash
      ) {
        return {
          valid: true,
          user: credentials.user,
          token: credentials.token,
        };
      }

      return { valid: false };
    } catch (error) {
      console.error('Error verifying offline credentials:', error);
      return { valid: false };
    }
  }

  /**
   * Simple hash function for password verification
   */
  private async simpleHash(str: string): Promise<string> {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Clear cached credentials
   */
  async clearCachedCredentials(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.CACHED_CREDENTIALS);
  }

  // ==================== PRODUCTS ====================

  /**
   * Cache products for offline use
   */
  async cacheProducts(products: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHED_PRODUCTS,
        JSON.stringify({
          products,
          cachedAt: new Date().toISOString(),
        }),
      );
      console.log(`Cached ${products.length} products for offline use`);
    } catch (error) {
      console.error('Error caching products:', error);
    }
  }

  /**
   * Get cached products
   */
  async getCachedProducts(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_PRODUCTS);
      if (cached) {
        const { products } = JSON.parse(cached);
        return products || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting cached products:', error);
      return [];
    }
  }

  /**
   * Update local product stock (after offline sale)
   */
  async updateLocalProductStock(
    productId: number,
    quantitySold: number,
  ): Promise<void> {
    try {
      const products = await this.getCachedProducts();
      const updatedProducts = products.map(p => {
        if (p.id === productId) {
          const currentStock = p.current_stock ?? p.quantity_in_stock ?? 0;
          return {
            ...p,
            current_stock: Math.max(0, currentStock - quantitySold),
            quantity_in_stock: Math.max(0, currentStock - quantitySold),
          };
        }
        return p;
      });
      await this.cacheProducts(updatedProducts);
    } catch (error) {
      console.error('Error updating local product stock:', error);
    }
  }

  // ==================== CUSTOMERS ====================

  /**
   * Cache customers for offline use
   */
  async cacheCustomers(customers: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHED_CUSTOMERS,
        JSON.stringify({
          customers,
          cachedAt: new Date().toISOString(),
        }),
      );
      console.log(`Cached ${customers.length} customers for offline use`);
    } catch (error) {
      console.error('Error caching customers:', error);
    }
  }

  /**
   * Get cached customers
   */
  async getCachedCustomers(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_CUSTOMERS);
      if (cached) {
        const { customers } = JSON.parse(cached);
        return customers || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting cached customers:', error);
      return [];
    }
  }

  // ==================== PENDING SALES ====================

  /**
   * Add a sale to the pending queue
   */
  async addPendingSale(saleData: any): Promise<string> {
    try {
      const pendingSales = await this.getPendingSales();

      const pendingSale: PendingSale = {
        id: this.generateUUID(),
        data: saleData,
        createdAt: new Date().toISOString(),
        attempts: 0,
      };

      pendingSales.push(pendingSale);

      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_SALES,
        JSON.stringify(pendingSales),
      );

      console.log('Sale added to pending queue:', pendingSale.id);
      return pendingSale.id;
    } catch (error) {
      console.error('Error adding pending sale:', error);
      throw error;
    }
  }

  /**
   * Get all pending sales
   */
  async getPendingSales(): Promise<PendingSale[]> {
    try {
      const pending = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SALES);
      return pending ? JSON.parse(pending) : [];
    } catch (error) {
      console.error('Error getting pending sales:', error);
      return [];
    }
  }

  /**
   * Remove a pending sale (after successful sync)
   */
  async removePendingSale(localId: string): Promise<void> {
    try {
      const pendingSales = await this.getPendingSales();
      const filtered = pendingSales.filter(s => s.id !== localId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_SALES,
        JSON.stringify(filtered),
      );
    } catch (error) {
      console.error('Error removing pending sale:', error);
    }
  }

  /**
   * Update pending sale attempt count
   */
  async updatePendingSaleAttempt(localId: string): Promise<void> {
    try {
      const pendingSales = await this.getPendingSales();
      const updated = pendingSales.map(s => {
        if (s.id === localId) {
          return {
            ...s,
            attempts: s.attempts + 1,
            lastAttempt: new Date().toISOString(),
          };
        }
        return s;
      });
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_SALES,
        JSON.stringify(updated),
      );
    } catch (error) {
      console.error('Error updating pending sale attempt:', error);
    }
  }

  /**
   * Get pending sales count
   */
  async getPendingSalesCount(): Promise<number> {
    const sales = await this.getPendingSales();
    return sales.length;
  }

  // ==================== SYNC STATE ====================

  /**
   * Update last sync time
   */
  async setLastSyncTime(): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_SYNC_TIME,
      new Date().toISOString(),
    );
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
  }

  // ==================== UTILITIES ====================

  /**
   * Generate a UUID for local records
   */
  private generateUUID(): string {
    return (
      'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * Clear all offline data
   */
  async clearAllOfflineData(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('All offline data cleared');
  }
}

export const offlineStorage = new OfflineStorage();
export default offlineStorage;
