import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global logout handler for 401 errors
let globalLogoutHandler: null | (() => void) = null;
export function setGlobalLogoutHandler(handler: () => void) {
  globalLogoutHandler = handler;
}

// API Configuration
const API_URL = __DEV__
  ? 'http://192.168.100.75:5000/api'
  : 'https://your-production-api.com/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user globally
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      if (globalLogoutHandler) globalLogoutHandler();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
export { API_URL };
