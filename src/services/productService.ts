import apiClient from './api';
import {
  Product,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '../types';

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
  async restockProduct(id: number, quantity: number, reason?: string): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>(
      `/products/${id}/restock`,
      { quantity, reason },
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
