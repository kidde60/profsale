import apiClient from './client';

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
  permissions: string[];
}

export interface StaffFormData {
  name: string;
  email: string;
  phone?: string;
  role: string;
  password?: string;
  is_active?: boolean;
}

export const staffService = {
  async getStaff() {
    const response = await apiClient.get<{ success: boolean; data: StaffMember[] }>(
      '/staff',
    );
    return response.data.data;
  },

  async getStaffMember(id: number) {
    const response = await apiClient.get<{ success: boolean; data: StaffMember }>(
      `/staff/${id}`,
    );
    return response.data.data;
  },

  async createStaff(data: StaffFormData) {
    const response = await apiClient.post('/staff', data);
    return response.data;
  },

  async updateStaff(id: number, data: StaffFormData) {
    const response = await apiClient.put(`/staff/${id}`, data);
    return response.data;
  },

  async deleteStaff(id: number) {
    await apiClient.delete(`/staff/${id}`);
  },

  async activateStaff(id: number) {
    await apiClient.put(`/staff/${id}/activate`);
  },
};
