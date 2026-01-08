import api from './api';

export interface ProfitLossReport {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    totalTransactions: number;
    totalRevenue: number;
    netRevenue: number;
    totalTax: number;
    totalDiscounts: number;
  };
  costs: {
    costOfGoodsSold: number;
    totalExpenses: number;
    expenseCount: number;
  };
  profit: {
    grossProfit: number;
    netProfit: number;
    grossProfitMargin: number;
    netProfitMargin: number;
  };
  expensesByCategory: Array<{
    category: string;
    count: number;
    total: number;
  }>;
}

export interface TrendData {
  period: string;
  revenue: number;
  transactionCount: number;
  expenses: number;
  expenseCount: number;
  netProfit: number;
}

const reportsService = {
  // Get profit & loss report
  getProfitLoss: async (startDate: string, endDate: string) => {
    const response = await api.get('/reports/profit-loss', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data.data;
  },

  // Get sales vs expenses trend
  getTrend: async (
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day',
  ) => {
    const response = await api.get('/reports/trend', {
      params: { start_date: startDate, end_date: endDate, group_by: groupBy },
    });
    return response.data.data;
  },

  // Get top performing products
  getTopProducts: async (
    startDate: string,
    endDate: string,
    limit: number = 10,
  ) => {
    const response = await api.get('/reports/top-products', {
      params: { start_date: startDate, end_date: endDate, limit },
    });
    return response.data.data;
  },
};

export default reportsService;
