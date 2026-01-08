import api from './api';

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  role:
    | 'owner'
    | 'manager'
    | 'cashier'
    | 'inventory_clerk'
    | 'accountant'
    | 'custom';
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

export interface Permission {
  name: string;
  label: string;
  category: string;
}

export interface ActivityLog {
  id: number;
  staff_name: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: any;
  created_at: string;
}

const staffService = {
  // Get all staff members
  getStaff: async (): Promise<StaffMember[]> => {
    const response = await api.get('/staff');
    return response.data.data;
  },

  // Get single staff member
  getStaffMember: async (id: number): Promise<StaffMember> => {
    const response = await api.get(`/staff/${id}`);
    return response.data.data;
  },

  // Create new staff member
  createStaff: async (data: {
    name: string;
    email: string;
    phone_number?: string;
    role: string;
    permissions: string[];
    password: string;
  }): Promise<StaffMember> => {
    const response = await api.post('/staff', data);
    return response.data.data;
  },

  // Update staff member
  updateStaff: async (
    id: number,
    data: {
      name: string;
      email: string;
      phone_number?: string;
      role: string;
      permissions: string[];
      is_active?: boolean;
      password?: string;
    },
  ): Promise<void> => {
    await api.put(`/staff/${id}`, data);
  },

  // Deactivate staff member
  deleteStaff: async (id: number): Promise<void> => {
    await api.delete(`/staff/${id}`);
  },

  // Activate staff member
  activateStaff: async (id: number): Promise<void> => {
    await api.put(`/staff/${id}/activate`);
  },

  // Get staff activity logs
  getStaffActivity: async (
    id: number,
    limit: number = 50,
  ): Promise<ActivityLog[]> => {
    const response = await api.get(`/staff/${id}/activity?limit=${limit}`);
    return response.data.data;
  },

  // Get available permissions
  getAvailablePermissions: async (): Promise<Permission[]> => {
    const response = await api.get('/staff/permissions/available');
    return response.data.data;
  },
};

export default staffService;
