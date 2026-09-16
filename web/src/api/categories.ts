import apiClient from './client';

export interface Category {
  id: number;
  name: string;
  description?: string;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export const categoryService = {
  async getCategories() {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  async createCategory(data: { name: string; description?: string }) {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },

  async updateCategory(
    id: number,
    data: { name: string; description?: string },
  ) {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: number) {
    await apiClient.delete(`/categories/${id}`);
  },
};
