import apiClient from './api';
import { DashboardStats, ApiResponse } from '../types';

export const dashboardService = {
  // Get dashboard overview
  async getOverview(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<DashboardStats>>(
      '/dashboard/overview',
    );
    return response.data.data!;
  },

  // Get sales trends
  async getTrends(period?: 'daily' | 'weekly' | 'monthly'): Promise<any> {
    const response = await apiClient.get<ApiResponse>('/dashboard/trends', {
      params: { period },
    });
    return response.data.data;
  },

  // Get business metrics
  async getMetrics(): Promise<any> {
    const response = await apiClient.get<ApiResponse>('/dashboard/metrics');
    return response.data.data;
  },

  // Get business alerts
  async getAlerts(): Promise<any> {
    const response = await apiClient.get<ApiResponse>('/dashboard/alerts');
    return response.data.data;
  },

  // Get quick stats
  async getQuickStats(): Promise<any> {
    const response = await apiClient.get<ApiResponse>('/dashboard/quick-stats');
    return response.data.data;
  },
};
