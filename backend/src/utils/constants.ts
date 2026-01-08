// User roles
export const USER_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

// Payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  MOBILE_MONEY: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT: 'credit',
} as const;

// Sale statuses
export const SALE_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

// Stock statuses
export const STOCK_STATUS = {
  NORMAL: 'normal',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

// Customer types
export const CUSTOMER_TYPES = {
  REGULAR: 'regular',
  VIP: 'vip',
  WHOLESALE: 'wholesale',
} as const;

// Business types
export const BUSINESS_TYPES = {
  RETAIL: 'retail',
  WHOLESALE: 'wholesale',
  SERVICE: 'service',
  RESTAURANT: 'restaurant',
  PHARMACY: 'pharmacy',
  OTHER: 'other',
} as const;

// Currency codes
export const CURRENCIES = {
  UGX: 'UGX',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
} as const;

// Inventory movement types
export const INVENTORY_MOVEMENT_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
  DAMAGE: 'damage',
  TRANSFER: 'transfer',
} as const;

// Subscription statuses
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  PAYMENT_DUE: 'payment_due',
  SALE_COMPLETED: 'sale_completed',
  NEW_CUSTOMER: 'new_customer',
  EMPLOYEE_INVITED: 'employee_invited',
  BUSINESS_UPDATE: 'business_update',
  SYSTEM_ALERT: 'system_alert',
} as const;

// File upload types
export const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
];
export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

// File size limits
export const FILE_SIZE_LIMITS = {
  PROFILE_IMAGE: 2 * 1024 * 1024, // 2MB
  PRODUCT_IMAGE: 5 * 1024 * 1024, // 5MB
  BUSINESS_LOGO: 1 * 1024 * 1024, // 1MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  RECEIPT: 500 * 1024, // 500KB
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// API rate limits
export const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10,
  },
  SALES: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 20,
  },
} as const;

// Default business settings
export const DEFAULT_BUSINESS_SETTINGS = {
  CURRENCY: 'UGX',
  TIMEZONE: 'Africa/Kampala',
  TAX_RATE: 0.18, // 18% VAT in Uganda
  MIN_STOCK_LEVEL: 5,
  RECEIPT_FOOTER: 'Thank you for your business!',
} as const;

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  STARTER: {
    ID: 'starter',
    NAME: 'Starter Plan',
    PRICE: 0,
    FEATURES: [
      'Up to 50 products',
      'Up to 100 sales per month',
      '1 employee',
      'Basic reporting',
    ],
    LIMITS: {
      PRODUCTS: 50,
      SALES_PER_MONTH: 100,
      EMPLOYEES: 1,
      STORAGE_GB: 1,
    },
  },
  BUSINESS: {
    ID: 'business',
    NAME: 'Business Plan',
    PRICE: 50000, // UGX
    FEATURES: [
      'Unlimited products & sales',
      'Up to 5 employees',
      'Advanced reporting',
      'Custom receipt branding',
      'SMS marketing (50 SMS/month)',
    ],
    LIMITS: {
      PRODUCTS: null,
      SALES_PER_MONTH: null,
      EMPLOYEES: 5,
      STORAGE_GB: 10,
    },
  },
  ENTERPRISE: {
    ID: 'enterprise',
    NAME: 'Enterprise Plan',
    PRICE: 150000, // UGX
    FEATURES: [
      'Everything in Business',
      'Unlimited employees',
      'Advanced analytics',
      'API access',
      'Priority support',
      'Custom integrations',
    ],
    LIMITS: {
      PRODUCTS: null,
      SALES_PER_MONTH: null,
      EMPLOYEES: null,
      STORAGE_GB: 50,
    },
  },
} as const;

// Uganda specific
export const UGANDA_SETTINGS = {
  COUNTRY_CODE: '+256',
  CURRENCY: 'UGX',
  TIMEZONE: 'Africa/Kampala',
  PHONE_REGEX: /^\+256[0-9]{9}$/,
  TAX_RATE: 0.18, // 18% VAT
  BUSINESS_REGISTRATION_PREFIXES: ['BN', 'RC', 'NGO'],
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Database table names
export const TABLES = {
  USERS: 'users',
  BUSINESSES: 'businesses',
  BUSINESS_USERS: 'business_users',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  SALES: 'sales',
  SALE_ITEMS: 'sale_items',
  EXPENSES: 'expenses',
  INVENTORY_MOVEMENTS: 'inventory_movements',
  SUBSCRIPTIONS: 'subscriptions',
  NOTIFICATIONS: 'notifications',
  SYNC_LOGS: 'sync_logs',
  RECEIPT_TEMPLATES: 'receipt_templates',
} as const;

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: number) => `user:${userId}:profile`,
  BUSINESS_SETTINGS: (businessId: number) => `business:${businessId}:settings`,
  PRODUCT_CATEGORIES: (businessId: number) =>
    `business:${businessId}:categories`,
  LOW_STOCK_PRODUCTS: (businessId: number) =>
    `business:${businessId}:low_stock`,
  DASHBOARD_DATA: (businessId: number) => `business:${businessId}:dashboard`,
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  USER_PROFILE: 300, // 5 minutes
  BUSINESS_SETTINGS: 600, // 10 minutes
  CATEGORIES: 1800, // 30 minutes
  DASHBOARD: 120, // 2 minutes
  LOW_STOCK: 300, // 5 minutes
} as const;

// SMS templates
export const SMS_TEMPLATES = {
  WELCOME: 'Welcome to ProfSale! Your business management journey starts now.',
  LOW_STOCK_ALERT:
    'Alert: {productName} is running low. Current stock: {currentStock}',
  SALE_RECEIPT:
    'Thank you for your purchase! Sale #{saleNumber} - Total: {total} UGX',
  EMPLOYEE_INVITE:
    'You have been invited to join {businessName} on ProfSale. Download the app to get started.',
} as const;

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: {
    SUBJECT: 'Welcome to ProfSale!',
    TEMPLATE: 'welcome',
  },
  PASSWORD_RESET: {
    SUBJECT: 'Reset your ProfSale password',
    TEMPLATE: 'password_reset',
  },
  EMPLOYEE_INVITE: {
    SUBJECT: "You've been invited to join {businessName}",
    TEMPLATE: 'employee_invite',
  },
  MONTHLY_REPORT: {
    SUBJECT: 'Your monthly business report',
    TEMPLATE: 'monthly_report',
  },
} as const;

// Validation rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    MESSAGE:
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  },
  PHONE: {
    REGEX: /^\+256[0-9]{9}$/,
    MESSAGE: 'Phone number must be in format +256XXXXXXXXX',
  },
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please provide a valid email address',
  },
  BUSINESS_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    MESSAGE: 'Business name must be between 2 and 100 characters',
  },
  PRODUCT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
    MESSAGE: 'Product name is required and must be less than 255 characters',
  },
} as const;

// Date formats
export const DATE_FORMATS = {
  API: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss',
  UGANDA_LOCALE: 'DD/MM/YYYY HH:mm',
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
  PHONE_UGANDA: /^\+256[0-9]{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_STRONG:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  BARCODE: /^[0-9]{8,13}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
} as const;

// Units of measurement
export const UNITS = [
  'pieces',
  'kg',
  'g',
  'liters',
  'ml',
  'meters',
  'cm',
  'boxes',
  'packs',
  'sets',
  'dozens',
  'pairs',
] as const;

// Export all constants as default
export default {
  USER_ROLES,
  PAYMENT_METHODS,
  SALE_STATUS,
  STOCK_STATUS,
  CUSTOMER_TYPES,
  BUSINESS_TYPES,
  CURRENCIES,
  INVENTORY_MOVEMENT_TYPES,
  SUBSCRIPTION_STATUS,
  NOTIFICATION_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  PAGINATION,
  RATE_LIMITS,
  DEFAULT_BUSINESS_SETTINGS,
  SUBSCRIPTION_PLANS,
  UGANDA_SETTINGS,
  ERROR_CODES,
  HTTP_STATUS,
  TABLES,
  CACHE_KEYS,
  CACHE_TTL,
  SMS_TEMPLATES,
  EMAIL_TEMPLATES,
  VALIDATION_RULES,
  DATE_FORMATS,
  REGEX_PATTERNS,
  UNITS,
};
