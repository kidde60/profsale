import apiClient from './client';

export const productService = {
  async getProducts(params?: any) {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  async getProduct(id: number) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: any) {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  async updateProduct(id: number, data: any) {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: number) {
    await apiClient.delete(`/products/${id}`);
  },
};
