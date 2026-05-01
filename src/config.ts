// Environment configuration
export const config = {
  // API Configuration
  API_URL: 'http://localhost:6000/api',
  //  __DEV__
  //   ? 'http://localhost:6000/api'
  //   : 'https://profsale.dangotechconcepts.com/api',
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
278150