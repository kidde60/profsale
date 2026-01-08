// Environment configuration
export const config = {
  // API Configuration
  API_URL: __DEV__
    ? 'http://192.168.1.173:5000/api'
    : 'https://your-production-api.com/api',
  API_TIMEOUT: 30000,

  // App Configuration
  APP_NAME: 'ProfSale',
  APP_VERSION: '1.0.0',

  // Business Configuration
  DEFAULT_CURRENCY: 'UGX',
  DEFAULT_TIMEZONE: 'Africa/Kampala',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Features
  ENABLE_BARCODE_SCANNER: true,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_PUSH_NOTIFICATIONS: false,

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'user',
    THEME: 'theme',
  },
};
