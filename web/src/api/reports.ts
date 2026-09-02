import apiClient from './client';

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
    inventoryExpenses: number;
    inventoryExpenseCount: number;
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

export const reportsService = {
  async getProfitLoss(startDate: string, endDate: string) {
    const response = await apiClient.get<{ success: boolean; data: ProfitLossReport }>(
      '/reports/profit-loss',
      { params: { start_date: startDate, end_date: endDate } },
    );
    return response.data.data;
  },

  async getTrend(startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' = 'day') {
    const response = await apiClient.get('/reports/trend', {
      params: { start_date: startDate, end_date: endDate, group_by: groupBy },
    });
    return response.data.data;
  },

  async getTopProducts(startDate: string, endDate: string, limit = 10) {
    const response = await apiClient.get('/reports/top-products', {
      params: { start_date: startDate, end_date: endDate, limit },
    });
    return response.data.data;
  },
};
