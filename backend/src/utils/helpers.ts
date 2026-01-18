import crypto from 'crypto';
import { ApiResponse } from '../types';

/**
 * Generate a unique sale number
 */
export const generateSaleNumber = (businessId: number): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp

  return `PS${businessId}${year}${month}${day}${timestamp}`;
};

/**
 * Generate a random string of specified length
 */
export const generateRandomString = (length: number = 32): string => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Format currency amount (Uganda Shillings)
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'UGX',
): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format phone number to international format
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If it starts with 0, replace with +256
  if (cleaned.startsWith('0')) {
    return `+256${cleaned.slice(1)}`;
  }

  // If it starts with 256, add +
  if (cleaned.startsWith('256')) {
    return `+${cleaned}`;
  }

  // If it doesn't start with +256, assume it's missing country code
  if (!cleaned.startsWith('256')) {
    return `+256${cleaned}`;
  }

  return phone;
};

/**
 * Validate Uganda phone number
 */
export const isValidUgandaPhone = (phone: string): boolean => {
  const phoneRegex = /^\+256[0-9]{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
};

/**
 * Calculate profit margin
 */
export const calculateProfitMargin = (
  sellingPrice: number,
  buyingPrice: number,
): number => {
  if (buyingPrice === 0) return 0;
  return (
    Math.round(((sellingPrice - buyingPrice) / buyingPrice) * 100 * 100) / 100
  );
};

/**
 * Parse string to number safely
 */
export const safeParseInt = (value: any, defaultValue: number = 0): number => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse string to float safely
 */
export const safeParseFloat = (
  value: any,
  defaultValue: number = 0,
): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Create standardized API response
 */
export const createApiResponse = <T>(
  success: boolean,
  message: string,
  data?: T,
  errors?: any[],
): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (errors !== undefined) {
    response.errors = errors;
  }

  return response;
};

/**
 * Clean and sanitize search terms
 */
export const sanitizeSearchTerm = (term: string): string => {
  return term
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // Remove special characters
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

/**
 * Generate barcode (simple implementation)
 */
export const generateBarcode = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 4);
  return `${timestamp}${random}`.substr(0, 13); // EAN-13 compatible length
};

/**
 * Validate barcode format
 */
export const isValidBarcode = (barcode: string): boolean => {
  // Basic validation for common barcode formats
  const barcodeRegex = /^[0-9]{8,13}$/;
  return barcodeRegex.test(barcode);
};

/**
 * Convert date to Uganda timezone
 */
export const toUgandaTime = (date: Date = new Date()): Date => {
  const ugandaOffset = 3; // UTC+3
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + ugandaOffset * 3600000);
};

/**
 * Format date for Uganda locale
 */
export const formatDateUganda = (date: Date): string => {
  return new Intl.DateTimeFormat('en-UG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kampala',
  }).format(date);
};

/**
 * Sleep function for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      retries++;

      if (retries >= maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, retries - 1);
      await sleep(delay);
    }
  }

  throw new Error('Max retries exceeded');
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove undefined/null values from object
 */
export const cleanObject = (obj: any): any => {
  const cleaned: any = {};

  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  });

  return cleaned;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate a secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash sensitive data
 */
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Mask sensitive information for logging
 */
export const maskSensitiveData = (
  data: string,
  visibleChars: number = 4,
): string => {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }

  const start = data.slice(0, visibleChars / 2);
  const end = data.slice(-visibleChars / 2);
  const middle = '*'.repeat(data.length - visibleChars);

  return `${start}${middle}${end}`;
};

/**
 * Convert string to kebab-case
 */
export const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

/**
 * Convert string to camelCase
 */
export const toCamelCase = (str: string): string => {
  return str
    .replace(/[-_\s]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[A-Z]/, char => char.toLowerCase());
};

/**
 * Truncate string with ellipsis
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Check if file type is allowed
 */
export const isAllowedFileType = (
  filename: string,
  allowedTypes: string[],
): boolean => {
  const extension = getFileExtension(filename).toLowerCase();
  return allowedTypes.includes(extension);
};

/**
 * Convert bytes to human readable format
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default {
  generateSaleNumber,
  generateRandomString,
  formatCurrency,
  formatPhoneNumber,
  isValidUgandaPhone,
  calculatePercentage,
  calculateProfitMargin,
  safeParseInt,
  safeParseFloat,
  createApiResponse,
  sanitizeSearchTerm,
  generateBarcode,
  isValidBarcode,
  toUgandaTime,
  formatDateUganda,
  sleep,
  retryWithBackoff,
  deepClone,
  cleanObject,
  isValidEmail,
  generateSecureToken,
  hashData,
  maskSensitiveData,
  toKebabCase,
  toCamelCase,
  truncateString,
  isEmpty,
  getFileExtension,
  isAllowedFileType,
  formatBytes,
};
