import apiClient from './api';
import {
  Customer,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
} from '../types';

export const customerService = {
  // Get all customers
  async getCustomers(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Customer>> {
    const response = await apiClient.get<PaginatedResponse<Customer>>(
      '/customers',
      { params },
    );
    return response.data;
  },

  // Get single customer
  async getCustomer(id: number): Promise<Customer> {
    const response = await apiClient.get<ApiResponse<Customer>>(
      `/customers/${id}`,
    );
    return response.data.data!;
  },

  // Create customer
  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.post<ApiResponse<Customer>>(
      '/customers',
      data,
    );
    return response.data.data!;
  },

  // Update customer
  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.put<ApiResponse<Customer>>(
      `/customers/${id}`,
      data,
    );
    return response.data.data!;
  },

  // Delete customer
  async deleteCustomer(id: number): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },

  // Search customers
  async searchCustomers(query: string): Promise<Customer[]> {
    const response = await apiClient.get<ApiResponse<Customer[]>>(
      `/customers/search/${query}`,
    );
    return response.data.data || [];
  },

  // Get customer loyalty info
  async getCustomerLoyalty(id: number): Promise<any> {
    const response = await apiClient.get<ApiResponse>(
      `/customers/${id}/loyalty`,
    );
    return response.data.data;
  },

  // Get customer analytics
  async getCustomerAnalytics(): Promise<any> {
    const response = await apiClient.get<ApiResponse>(
      '/customers/analytics/dashboard',
    );
    return response.data.data;
  },
};
