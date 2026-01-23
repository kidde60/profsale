import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

let globalLogoutHandler: null | (() => void) = null;
export function setGlobalLogoutHandler(handler: () => void) {
  globalLogoutHandler = handler;
}

const API_URL = 'https://profsale.dangotechconcepts.com/api';

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (!error.response) {
      console.log('Network error:', error.message);
      Alert.alert(
        'Network Error',
        'Please check your internet connection and try again.',
      );
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      if (globalLogoutHandler) globalLogoutHandler();
    }

    console.log('API error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  },
);

export default apiClient;
export { API_URL };
