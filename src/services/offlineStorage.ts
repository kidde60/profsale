// services/offlineStorage.ts - Offline storage service
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

export interface StorageCache {
  key: string;
  data: any;
  timestamp: string;
  ttl: number;
}

class OfflineStorage {
  private cache: Map<string, StorageCache> = new Map();
  private maxCacheSize: number = 100;

  async get(key: string): Promise<any | null> {
    try {
      // First check memory cache
      const memoryCache = this.cache.get(key);
      if (memoryCache && !this.isExpired(memoryCache)) {
        return memoryCache.data;
      }

      // Check persistent storage
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed: StorageCache = JSON.parse(stored);
        if (!this.isExpired(parsed)) {
          // Update memory cache
          this.cache.set(key, parsed);
          return parsed.data;
        } else {
          // Remove expired item
          await AsyncStorage.removeItem(key);
          this.cache.delete(key);
        }
      }

      return null;
    } catch (error) {
      logger.error('Failed to get from storage', { error, key });
      return null;
    }
  }

  async set(key: string, data: any, ttl: number = 300000): Promise<void> {
    try {
      const cacheItem: StorageCache = {
        key,
        data,
        timestamp: new Date().toISOString(),
        ttl,
      };

      // Update memory cache
      this.cache.set(key, cacheItem);

      // Update persistent storage
      await AsyncStorage.setItem(key, JSON.stringify(cacheItem));

      // Clean up if cache is too large
      if (this.cache.size > this.maxCacheSize) {
        this.cleanupCache();
      }
    } catch (error) {
      logger.error('Failed to set storage', { error, key });
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.error('Failed to remove from storage', { error, key });
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      await AsyncStorage.clear();
      logger.info('Storage cleared');
    } catch (error) {
      logger.error('Failed to clear storage', { error });
    }
  }

  private isExpired(cacheItem: StorageCache): boolean {
    const now = Date.now();
    const timestamp = new Date(cacheItem.timestamp).getTime();
    return now - timestamp > cacheItem.ttl;
  }

  private cleanupCache(): void {
    const entries = Array.from(this.cache.entries());
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => 
      new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
    );
    
    // Remove oldest 25% of entries
    const toRemove = Math.floor(this.maxCacheSize * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
      AsyncStorage.removeItem(entries[i][0]).catch(err => {
        logger.error('Failed to remove old cache entry', { error: err });
      });
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return Array.from(keys);
    } catch (error) {
      logger.error('Failed to get all keys', { error });
      return [];
    }
  }

  async getCacheSize(): Promise<number> {
    return this.cache.size;
  }
}

export const offlineStorage = new OfflineStorage();
export default offlineStorage;
