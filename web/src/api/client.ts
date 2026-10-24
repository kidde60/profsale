import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { cacheKey, enqueue, getCached, setCached, type QueuedWrite } from '../lib/offlineStore';

declare module 'axios' {
  interface AxiosRequestConfig {
    offlineReplay?: boolean;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6000/api';

const WRITE_METHODS = ['post', 'put', 'patch', 'delete'];

export const isNetworkError = (error: unknown) =>
  axios.isAxiosError(error) && !error.response && error.code !== 'ERR_CANCELED';

const offlineResponse = (config: InternalAxiosRequestConfig, data: unknown, status = 200): AxiosResponse => ({
  data,
  status,
  statusText: 'Offline',
  headers: {},
  config,
});

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cache successful GETs; serve them when the network is down; queue writes made offline
apiClient.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get') {
      void setCached(cacheKey(response.config.url, response.config.params), response.data);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    if (!isNetworkError(error)) return Promise.reject(error);

    const config = error.config as InternalAxiosRequestConfig;
    const method = config.method ?? '';

    if (method === 'get') {
      const cached = await getCached(cacheKey(config.url, config.params));
      if (cached !== undefined) return offlineResponse(config, cached);
    } else if (WRITE_METHODS.includes(method) && !navigator.onLine && !config.offlineReplay && !config.url?.startsWith('/auth/')) {
      await enqueue({
        method: method as QueuedWrite['method'],
        url: config.url ?? '',
        params: config.params,
        data: config.data,
      });
      return offlineResponse(config, { success: true, queued: true, data: null }, 202);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
