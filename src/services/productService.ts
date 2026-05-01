import apiClient from './api';
import {
  Product,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '../types';
import { localStorageService } from './localStorageService';
import { networkService } from './networkService';

export const productService = {
  // Get all products with filters
  async getProducts(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<PaginatedResponse<Product>>(
      '/products',
      { params },
    );
    return response.data;
  },

  // Get single product
  async getProduct(id: number): Promise<Product> {
    const response = await apiClient.get<any>(`/products/${id}`);
    // Backend returns { success, data: { product } }
    return response.data.data?.product || response.data.data;
  },

  // Create product
  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>(
      '/products',
      data,
    );
    return response.data.data!;
  },

  // Update product
  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(
      `/products/${id}`,
      data,
    );
    return response.data.data!;
  },

  // Delete product
  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  // Restock product
  async restockProduct(
    id: number,
    quantity: number,
    reason?: string,
    costPrice?: number,
    sellingPrice?: number,
  ): Promise<any> {
    // If offline, update local storage
    if (!networkService.isNetworkAvailable()) {
      const localProduct = await localStorageService.getProduct(id);
      if (localProduct) {
        const currentStock = parseFloat(String(localProduct.current_stock || '0')) || 0;
        const newStock = currentStock + quantity;
        const updateData: any = { current_stock: newStock };
        if (costPrice !== undefined) updateData.buying_price = costPrice;
        if (sellingPrice !== undefined) updateData.selling_price = sellingPrice;
        await localStorageService.updateProduct(id, updateData);
        return { productId: id, previousQuantity: localProduct.current_stock, quantityAdded: quantity, newQuantity: newStock };
      }
      throw new Error('Product not found in local storage');
    }

    // If online, call API
    const payload: any = { quantity, reason };
    if (costPrice !== undefined) payload.cost_price = costPrice;
    if (sellingPrice !== undefined) payload.selling_price = sellingPrice;
    
    const response = await apiClient.post<ApiResponse<any>>(
      `/products/${id}/restock`,
      payload,
    );
    return response.data.data;
  },

  // Get stock records for a product
  async getStockRecords(id: number): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      `/products/${id}/stock-records`,
    );
    return response.data.data;
  },

  // Get all stock records for the business
  async getAllStockRecords(params?: {
    startDate?: string;
    endDate?: string;
    changeType?: string;
    productId?: number;
  }): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/products/stock-records/all',
      { params },
    );
    return response.data.data;
  },

  // Get restock report with aggregated data
  async getRestockReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/products/reports/restock',
      { params },
    );
    return response.data.data;
  },

  // Record damaged or expired products
  async recordDamage(productId: number, data: {
    quantity: number;
    reason: string;
    changeType?: 'damage' | 'expiry';
  }): Promise<any> {
    // If offline, update local storage
    if (!networkService.isNetworkAvailable()) {
      const localProduct = await localStorageService.getProduct(productId);
      if (localProduct) {
        const currentStock = parseFloat(String(localProduct.current_stock || '0')) || 0;
        const newStock = currentStock - data.quantity;
        if (newStock < 0) {
          throw new Error('Cannot remove more than current stock');
        }
        await localStorageService.updateProduct(productId, { current_stock: newStock });
        return { productId, previousQuantity: localProduct.current_stock, quantityRemoved: data.quantity, newQuantity: newStock };
      }
      throw new Error('Product not found in local storage');
    }

    // If online, call API
    const response = await apiClient.post<ApiResponse<any>>(
      `/products/${productId}/damage`,
      data,
    );
    return response.data.data;
  },

  // Search by barcode
  async searchByBarcode(barcode: string): Promise<Product | null> {
    const response = await apiClient.get<ApiResponse<Product>>(
      `/products/search/barcode/${barcode}`,
    );
    return response.data.data || null;
  },

  // Get categories
  async getCategories(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(
      '/products/categories/list',
    );
    return response.data.data || [];
  },

  // Get low stock products
  async getLowStockProducts(): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products', {
      params: { lowStock: true },
    });
    return response.data.data || [];
  },
};
