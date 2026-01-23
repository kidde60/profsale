/**
 * Offline-Aware Sales Service
 * Handles sales with offline support - queues sales when offline, syncs when online
 */

import { salesService, CreateSaleData } from './salesService';
import { offlineStorage } from './offline/OfflineStorageSQLite';
import { isOnline } from '../hooks/useNetworkStatus';
import { Sale } from '../types';

export interface OfflineSale extends Sale {
  isOffline: boolean;
  localId?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface CreateSaleResult {
  success: boolean;
  sale?: Sale | OfflineSale;
  isOffline: boolean;
  localId?: string;
  message: string;
}

export const offlineSalesService = {
  /**
   * Create a sale - works both online and offline
   */
  async createSale(data: CreateSaleData): Promise<CreateSaleResult> {
    const online = await isOnline();

    if (online) {
      // Online - create sale directly on server
      try {
        const sale = await salesService.createSale(data);
        return {
          success: true,
          sale,
          isOffline: false,
          message: 'Sale completed successfully',
        };
      } catch (error: any) {
        // If online request fails, try to save offline
        console.log('Online sale failed, saving offline:', error.message);
        return this.createOfflineSale(data);
      }
    } else {
      // Offline - save to local queue
      return this.createOfflineSale(data);
    }
  },

  /**
   * Create an offline sale (saved to pending queue)
   */
  async createOfflineSale(data: CreateSaleData): Promise<CreateSaleResult> {
    try {
      // Prepare data for offline storage (convert null to undefined)
      const offlineData = {
        ...data,
        customerName: data.customerName ?? undefined,
        customerPhone: data.customerPhone ?? undefined,
      };

      // Add to pending queue
      const localId = await offlineStorage.addPendingSale(offlineData);

      // Update local product stock
      for (const item of data.items) {
        await offlineStorage.updateLocalProductStock(
          item.productId,
          item.quantity,
        );
      }

      // Create a local sale object for display
      const offlineSale: OfflineSale = {
        id: -1, // Negative ID indicates offline
        business_id: data.businessId || 0,
        customer_id: data.customer_id,
        customer_name: data.customerName || undefined,
        customer_phone: data.customerPhone || undefined,
        sale_date: new Date().toISOString(),
        total_amount: data.total || this.calculateTotal(data),
        discount_amount: data.discountAmount || 0,
        tax_amount:
          ((data.taxRate || 0) * (data.total || this.calculateTotal(data))) /
          100,
        payment_method: data.paymentMethod,
        payment_status: 'paid',
        notes: data.notes,
        created_by: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isOffline: true,
        localId,
        syncStatus: 'pending',
      };

      return {
        success: true,
        sale: offlineSale,
        isOffline: true,
        localId,
        message: 'Sale saved offline. Will sync when connected.',
      };
    } catch (error: any) {
      console.error('Error creating offline sale:', error);
      return {
        success: false,
        isOffline: true,
        message: error.message || 'Failed to save offline sale',
      };
    }
  },

  /**
   * Calculate total from sale items
   */
  calculateTotal(data: CreateSaleData): number {
    return data.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      return sum + (itemTotal - discount);
    }, 0);
  },

  /**
   * Get all sales (combines online and pending offline sales)
   */
  async getSales(params?: any): Promise<{ data: Sale[]; isOffline: boolean }> {
    const online = await isOnline();

    if (online) {
      try {
        const response = await salesService.getSales(params);
        return {
          data: response.data || [],
          isOffline: false,
        };
      } catch (error) {
        console.log('Failed to fetch online sales, returning empty');
        return { data: [], isOffline: true };
      }
    }

    // When offline, we can't show historical sales from server
    // But we can show pending offline sales
    const pendingSales = await offlineStorage.getPendingSales();
    const offlineSales: OfflineSale[] = pendingSales.map((pending, index) => {
      // Calculate total using items data directly
      const itemsTotal = pending.data.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const discount = item.discount || 0;
        return sum + (itemTotal - discount);
      }, 0);

      return {
        id: -(index + 1),
        business_id: pending.data.businessId || 0,
        customer_name: pending.data.customerName,
        customer_phone: pending.data.customerPhone,
        sale_date: pending.createdAt,
        total_amount: pending.data.total || itemsTotal,
        discount_amount: pending.data.discountAmount || 0,
        tax_amount: 0,
        payment_method: pending.data.paymentMethod as
          | 'cash'
          | 'mobile_money'
          | 'card'
          | 'credit',
        payment_status: 'paid',
        notes: pending.data.notes,
        created_by: 0,
        created_at: pending.createdAt,
        updated_at: pending.createdAt,
        isOffline: true,
        localId: pending.localId,
        syncStatus: 'pending' as const,
      };
    });

    return {
      data: offlineSales,
      isOffline: true,
    };
  },

  /**
   * Get pending sales count
   */
  async getPendingSalesCount(): Promise<number> {
    return offlineStorage.getPendingSalesCount();
  },

  /**
   * Get pending sales details
   */
  async getPendingSales() {
    return offlineStorage.getPendingSales();
  },
};

export default offlineSalesService;
