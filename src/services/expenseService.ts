import api from './api';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  payment_method: 'cash' | 'mobile_money' | 'bank_transfer' | 'cheque';
  payment_reference?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
}

export interface ExpenseSummary {
  total: {
    total_count: number;
    total_amount: number;
  };
  byCategory: Array<{
    category: string;
    count: number;
    total: number;
  }>;
  byPaymentMethod: Array<{
    payment_method: string;
    count: number;
    total: number;
  }>;
}

const expenseService = {
  // Get all expenses with filtering
  getExpenses: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    start_date?: string;
    end_date?: string;
    payment_method?: string;
  }) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  // Get expense summary
  getExpenseSummary: async (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await api.get('/expenses/summary', { params });
    return response.data;
  },

  // Get single expense
  getExpense: async (id: number) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Create expense
  createExpense: async (data: {
    description: string;
    amount: number;
    category: string;
    expenseDate: string;
    paymentMethod?: string;
    paymentReference?: string;
    receiptUrl?: string;
    notes?: string;
  }) => {
    const response = await api.post('/expenses', data);
    return response.data.data;
  },

  // Update expense
  updateExpense: async (
    id: number,
    data: Partial<{
      description: string;
      amount: number;
      category: string;
      expenseDate: string;
      paymentMethod: string;
      paymentReference: string;
      receiptUrl: string;
      notes: string;
    }>,
  ) => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data.data;
  },

  // Delete expense
  deleteExpense: async (id: number) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
};

export default expenseService;
