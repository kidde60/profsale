/**
 * Offline-Aware Product Service
 * Returns cached products when offline
 */

import { productService } from './productService';
import { offlineStorage } from './offline/OfflineStorageSQLite';
import { isOnline } from '../hooks/useNetworkStatus';
import { Product, PaginatedResponse, PaginationParams } from '../types';

export const offlineProductService = {
  /**
   * Get products - returns cached data when offline
   */
  async getProducts(
    params?: PaginationParams,
  ): Promise<{ data: Product[]; isOffline: boolean }> {
    const online = await isOnline();

    if (online) {
      try {
        const response = await productService.getProducts(params);
        const products = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.products || [];

        // Cache products for offline use
        await offlineStorage.cacheProducts(products);

        return {
          data: products,
          isOffline: false,
        };
      } catch (error) {
        console.log('Failed to fetch online products, returning cached');
        const cachedProducts = await offlineStorage.getCachedProducts();
        return {
          data: cachedProducts,
          isOffline: true,
        };
      }
    }

    // Return cached products when offline
    const cachedProducts = await offlineStorage.getCachedProducts();
    return {
      data: cachedProducts,
      isOffline: true,
    };
  },

  /**
   * Get single product
   */
  async getProduct(
    id: number,
  ): Promise<{ data: Product | null; isOffline: boolean }> {
    const online = await isOnline();

    if (online) {
      try {
        const product = await productService.getProduct(id);
        return { data: product, isOffline: false };
      } catch (error) {
        // Try to find in cache
        const cachedProducts = await offlineStorage.getCachedProducts();
        const product = cachedProducts.find(p => p.id === id) || null;
        return { data: product, isOffline: true };
      }
    }

    // Find in cached products
    const cachedProducts = await offlineStorage.getCachedProducts();
    const product = cachedProducts.find(p => p.id === id) || null;
    return { data: product, isOffline: true };
  },

  /**
   * Search products by barcode (offline-aware)
   */
  async searchByBarcode(
    barcode: string,
  ): Promise<{ data: Product | null; isOffline: boolean }> {
    const online = await isOnline();

    if (online) {
      try {
        const product = await productService.searchByBarcode(barcode);
        return { data: product, isOffline: false };
      } catch (error) {
        // Try to find in cache
        const cachedProducts = await offlineStorage.getCachedProducts();
        const product = cachedProducts.find(p => p.barcode === barcode) || null;
        return { data: product, isOffline: true };
      }
    }

    // Search in cached products
    const cachedProducts = await offlineStorage.getCachedProducts();
    const product = cachedProducts.find(p => p.barcode === barcode) || null;
    return { data: product, isOffline: true };
  },

  /**
   * Get categories (offline-aware)
   */
  async getCategories(): Promise<{ data: any[]; isOffline: boolean }> {
    const online = await isOnline();

    if (online) {
      try {
        const categories = await productService.getCategories();
        return { data: categories, isOffline: false };
      } catch (error) {
        // Return empty categories when offline
        return { data: [], isOffline: true };
      }
    }

    return { data: [], isOffline: true };
  },

  /**
   * Update local stock after offline sale
   */
  async updateLocalStock(
    productId: number,
    quantitySold: number,
  ): Promise<void> {
    await offlineStorage.updateLocalProductStock(productId, quantitySold);
  },

  /**
   * Get cached products directly
   */
  async getCachedProducts(): Promise<Product[]> {
    return offlineStorage.getCachedProducts();
  },
};

export default offlineProductService;
