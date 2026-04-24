// services/apiRetry.ts - Request retry mechanism with exponential backoff
import apiClient from './api';
import logger from '../utils/logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: any) => void;
}

export class ApiRetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: any,
  ) {
    super(message);
    this.name = 'ApiRetryError';
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, initialDelay: number, maxDelay: number): number {
  const exponentialDelay = initialDelay * Math.pow(2, attempt);
  const jitter = exponentialDelay * 0.1 * Math.random(); // Add 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

export async function requestWithRetry<T>(
  requestFn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    retryableStatusCodes = [408, 429, 500, 502, 503, 504],
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      const isRetryable =
        !error.response ||
        retryableStatusCodes.includes(error.response?.status) ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ENETDOWN' ||
        error.code === 'ETIMEDOUT';

      if (!isRetryable || attempt === maxRetries) {
        logger.error('Request failed after retries', {
          attempt: attempt + 1,
          maxRetries,
          error: error.message,
        });
        throw error;
      }

      const backoffDelay = calculateBackoff(attempt, initialDelay, maxDelay);
      
      logger.warn('Retrying request', {
        attempt: attempt + 1,
        maxRetries,
        delay: backoffDelay,
        error: error.message,
      });

      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      await delay(backoffDelay);
    }
  }

  throw new ApiRetryError(
    'Request failed after maximum retries',
    maxRetries,
    lastError,
  );
}

// Wrapper for axios requests
export function createRetryableApiClient(defaultOptions: RetryOptions = {}) {
  return {
    get: <T>(url: string, config?: any) =>
      requestWithRetry(() => apiClient.get<T>(url, config), defaultOptions),
    post: <T>(url: string, data?: any, config?: any) =>
      requestWithRetry(() => apiClient.post<T>(url, data, config), defaultOptions),
    put: <T>(url: string, data?: any, config?: any) =>
      requestWithRetry(() => apiClient.put<T>(url, data, config), defaultOptions),
    patch: <T>(url: string, data?: any, config?: any) =>
      requestWithRetry(() => apiClient.patch<T>(url, data, config), defaultOptions),
    delete: <T>(url: string, config?: any) =>
      requestWithRetry(() => apiClient.delete<T>(url, config), defaultOptions),
  };
}

export default {
  requestWithRetry,
  createRetryableApiClient,
  ApiRetryError,
};
