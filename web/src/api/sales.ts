import apiClient from './client';

export const salesService = {
  async getSales(params?: any) {
    const response = await apiClient.get('/sales', { params });
    return response.data;
  },

  async getSale(id: number) {
    const response = await apiClient.get(`/sales/${id}`);
    return response.data;
  },

  async createSale(data: any) {
    const response = await apiClient.post('/sales', data);
    return response.data;
  },

  async recordPayment(saleId: number, data: any) {
    const response = await apiClient.post(`/sales/${saleId}/payment`, data);
    return response.data;
  },
};
