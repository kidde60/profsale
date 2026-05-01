import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { networkService } from './networkService';

declare const __DEV__: boolean;

let globalLogoutHandler: null | (() => void) = null;
export function setGlobalLogoutHandler(handler: () => void) {
  globalLogoutHandler = handler;
}

const API_URL = __DEV__
  ? 'http://localhost:6000/api'
  : 'https://profsale.dangotechconcepts.com/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('authToken');
    console.log('Request interceptor - Token:', token ? 'Present' : 'Missing');
    console.log('Request URL:', config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.log('No token found in AsyncStorage');
    }
    return config;
  },
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (!error.response) {
      // Network error - check if offline
      if (!networkService.isNetworkAvailable()) {
        console.log('Offline - queuing request');
        
        // Only queue write operations (POST, PUT, DELETE, PATCH)
        if (error.config?.method && ['post', 'put', 'delete', 'patch'].includes(error.config.method)) {
          await networkService.addToQueue({
            id: Date.now().toString(),
            url: error.config.url || '',
            method: error.config.method.toUpperCase() as any,
            body: error.config.data,
            headers: error.config.headers as Record<string, string>,
            timestamp: Date.now(),
          });
          
          Alert.alert(
            'Offline Mode',
            'Request saved. Will sync when you are back online.',
          );
          return Promise.reject({ isOffline: true });
        }
      }
      
      console.log('Network error:', error.message);
      Alert.alert(
        'Network Error',
        'Please check your internet connection and try again.',
      );
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      console.log('Got 401 error');
      const errorMessage = (error.response?.data as any)?.message;
      console.log('Error message:', errorMessage);
      
      // Always logout on 401
      console.log('Clearing auth tokens and logging out');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      if (globalLogoutHandler) {
        console.log('Calling global logout handler');
        globalLogoutHandler();
      }
    }

    console.log('API error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  },
);

export default apiClient;
export { API_URL };
