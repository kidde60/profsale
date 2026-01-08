import api from './api';

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  max_products: number;
  trial_days: number;
  features: {
    max_users: number;
    sales_history_days: number;
    reports: boolean;
    expenses: boolean;
  };
  is_active: boolean;
}

export interface Subscription {
  id: number;
  business_id: number;
  plan_id: number;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  plan_name: string;
  price: number;
  currency: string;
  max_products: number;
  features: any;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPayment {
  id: number;
  business_id: number;
  subscription_id: number;
  plan_id: number;
  amount: number;
  currency: string;
  payment_method: string;
  mobile_number: string;
  transaction_reference: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_date: string | null;
  plan_name: string;
  created_at: string;
}

export interface ProductLimit {
  hasActiveSubscription: boolean;
  maxProducts: number;
  currentProducts: number;
  canAddMore: boolean;
  remaining?: number;
}

const subscriptionService = {
  // Get all available plans
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get('/subscriptions/plans');
    return response.data.data;
  },

  // Get current subscription
  getCurrentSubscription: async (): Promise<Subscription | null> => {
    const response = await api.get('/subscriptions/current');
    return response.data.data;
  },

  // Subscribe to a plan
  subscribe: async (planId: number, mobileNumber: string) => {
    const response = await api.post('/subscriptions/subscribe', {
      planId,
      mobileNumber,
    });
    return response.data;
  },

  // Confirm payment
  confirmPayment: async (
    subscriptionId: number,
    transactionReference: string,
  ) => {
    const response = await api.post('/subscriptions/confirm-payment', {
      subscriptionId,
      transactionReference,
    });
    return response.data;
  },

  // Get payment history
  getHistory: async (): Promise<SubscriptionPayment[]> => {
    const response = await api.get('/subscriptions/history');
    return response.data.data;
  },

  // Check product limit
  checkProductLimit: async (): Promise<ProductLimit> => {
    const response = await api.get('/subscriptions/check-limit');
    return response.data.data;
  },
};

export default subscriptionService;
