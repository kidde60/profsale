import apiClient from './api';
import {
  Sale,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '../types';

export interface CreateSaleData {
  businessId?: number;
  customer_id?: number;
  customerName?: string | null;
  customerPhone?: string | null;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'credit';
  total?: number;
  discountAmount?: number;
  taxRate?: number;
  notes?: string;
}

export const salesService = {
  // Get all sales
  async getSales(params?: PaginationParams): Promise<PaginatedResponse<Sale>> {
    const response = await apiClient.get<PaginatedResponse<Sale>>('/sales', {
      params,
    });
    return response.data;
  },

  // Get single sale
  async getSale(id: number): Promise<Sale> {
    const response = await apiClient.get<ApiResponse<any>>(`/sales/${id}`);
    // Backend returns { data: { sale: {...} } }
    return response.data.data?.sale || response.data.data || response.data;
  },

  // Create sale
  async createSale(data: CreateSaleData): Promise<Sale> {
    const response = await apiClient.post<ApiResponse<Sale>>('/sales', data);
    return response.data.data!;
  },

  // Cancel/refund sale
  async cancelSale(id: number): Promise<void> {
    await apiClient.put(`/sales/${id}/cancel`);
  },

  // Get daily sales report
  async getDailySalesReport(date?: string): Promise<any> {
    const response = await apiClient.get<ApiResponse>('/sales/reports/daily', {
      params: { date },
    });
    return response.data.data;
  },

  // Get sales analytics
  async getSalesAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const response = await apiClient.get<ApiResponse>(
      '/sales/reports/analytics',
      {
        params: { startDate, endDate },
      },
    );
    return response.data.data;
  },

  // Generate receipt
  async generateReceipt(id: number): Promise<any> {
    const response = await apiClient.get<ApiResponse>(`/sales/${id}/receipt`);
    return response.data.data;
  },
};
