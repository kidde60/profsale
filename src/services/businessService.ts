import apiClient from './api';
import { Business, ApiResponse } from '../types';

export const businessService = {
  // Get business profile
  async getProfile(): Promise<Business> {
    const response = await apiClient.get<ApiResponse<Business>>(
      '/business/profile',
    );
    return response.data.data!;
  },

  // Update business profile
  async updateProfile(data: Partial<Business>): Promise<Business> {
    const response = await apiClient.put<ApiResponse<Business>>(
      '/business/profile',
      data,
    );
    return response.data.data!;
  },

  // Get business settings
  async getSettings(): Promise<any> {
    const response = await apiClient.get<ApiResponse>('/business/settings');
    return response.data.data;
  },

  // Update business settings
  async updateSettings(data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse>(
      '/business/settings',
      data,
    );
    return response.data.data;
  },

  // Get payment methods
  async getPaymentMethods(): Promise<any> {
    const response = await apiClient.get<ApiResponse>(
      '/business/payment-methods',
    );
    return response.data.data;
  },

  // Update payment methods
  async updatePaymentMethods(data: any): Promise<any> {
    const response = await apiClient.put<ApiResponse>(
      '/business/payment-methods',
      data,
    );
    return response.data.data;
  },
};
