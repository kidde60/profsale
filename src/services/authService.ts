import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types';

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { user: any; token: string };
    }>('/auth/login', credentials);

    if (response.data.success && response.data.data.token) {
      await AsyncStorage.setItem('authToken', response.data.data.token);
      if (response.data.data.user) {
        await AsyncStorage.setItem(
          'user',
          JSON.stringify(response.data.data.user),
        );
      }
    }

    return {
      success: response.data.success,
      message: response.data.message,
      token: response.data.data.token,
      user: response.data.data.user,
    };
  },

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { user: any; token: string };
    }>('/auth/register', data);

    if (response.data.success && response.data.data.token) {
      await AsyncStorage.setItem('authToken', response.data.data.token);
      if (response.data.data.user) {
        await AsyncStorage.setItem(
          'user',
          JSON.stringify(response.data.data.user),
        );
      }
    }

    return {
      success: response.data.success,
      message: response.data.message,
      token: response.data.data.token,
      user: response.data.data.user,
    };
  },

  // Logout
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: User }>(
      '/auth/profile',
    );
    return response.data.data;
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },

  // Get stored user data
  async getStoredUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Forgot Password - Request reset code
  async forgotPassword(
    contact: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>('/auth/forgot-password', { contact });
    return response.data;
  },

  // Reset Password - Verify code and set new password
  async resetPassword(data: {
    contact: string;
    resetCode: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>('/auth/reset-password', data);
    return response.data;
  },
};
