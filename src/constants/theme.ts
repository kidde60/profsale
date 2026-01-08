// App Colors
export const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1e40af',
  primaryLight: '#60a5fa',

  secondary: '#10b981',
  secondaryDark: '#059669',
  secondaryLight: '#34d399',

  accent: '#f59e0b',
  accentDark: '#d97706',
  accentLight: '#fbbf24',

  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  background: '#f9fafb',
  backgroundDark: '#111827',

  surface: '#ffffff',
  surfaceDark: '#1f2937',

  text: '#111827',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  textDark: '#ffffff',

  border: '#e5e7eb',
  borderDark: '#374151',

  placeholder: '#9ca3af',
  disabled: '#d1d5db',

  white: '#ffffff',
  black: '#000000',
};

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border Radius
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Screen Sizes
export const SCREEN_SIZES = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// API Constants
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MM/DD/YYYY',
  LONG: 'MMMM DD, YYYY',
  WITH_TIME: 'MM/DD/YYYY HH:mm',
  TIME_ONLY: 'HH:mm',
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'ProfSale',
  APP_VERSION: '1.0.0',
  CURRENCY: 'UGX',
  TIMEZONE: 'Africa/Kampala',
  LANGUAGE: 'en',
};
