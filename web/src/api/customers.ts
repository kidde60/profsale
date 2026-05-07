import apiClient from './client';

export const customerService = {
  async getCustomers(params?: any) {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  async getCustomer(id: number) {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  async createCustomer(data: any) {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  async updateCustomer(id: number, data: any) {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomer(id: number) {
    await apiClient.delete(`/customers/${id}`);
  },

  async getCreditTransactions(customerId: number) {
    const response = await apiClient.get(`/customers/${customerId}/credit-transactions`);
    return response.data;
  },
};
