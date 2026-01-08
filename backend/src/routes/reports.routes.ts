import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Get profit & loss report
router.get(
  '/profit-loss',
  authenticateToken,
  requirePermission('view_reports'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }
      const businessId = req.user.businessId;

      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
        return;
      }

      // Get revenue from sales
      const [revenueResult] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_revenue,
        SUM(total_amount - tax_amount - discount_amount) as net_revenue,
        SUM(tax_amount) as total_tax,
        SUM(discount_amount) as total_discounts
      FROM sales
      WHERE business_id = ? 
        AND status = 'completed'
        AND sale_date >= ?
        AND sale_date <= ?`,
        [businessId, startDate, endDate],
      );

      // Get cost of goods sold (COGS) - sum of buying prices for sold items
      const [cogsResult] = await pool.execute<any[]>(
        `SELECT 
        SUM(si.quantity * p.buying_price) as cost_of_goods_sold
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.business_id = ?
        AND s.status = 'completed'
        AND s.sale_date >= ?
        AND s.sale_date <= ?`,
        [businessId, startDate, endDate],
      );

      // Get expenses
      const [expensesResult] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_expense_count,
        SUM(amount) as total_expenses
      FROM expenses
      WHERE business_id = ?
        AND expense_date >= ?
        AND expense_date <= ?`,
        [businessId, startDate, endDate],
      );

      // Get expenses by category
      const [expensesByCategory] = await pool.execute<any[]>(
        `SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM expenses
      WHERE business_id = ?
        AND expense_date >= ?
        AND expense_date <= ?
      GROUP BY category
      ORDER BY total DESC`,
        [businessId, startDate, endDate],
      );

      const revenue = revenueResult[0];
      const cogs = cogsResult[0].cost_of_goods_sold || 0;
      const expenses = expensesResult[0];

      const totalRevenue = parseFloat(revenue.total_revenue || 0);
      const totalCOGS = parseFloat(cogs);
      const totalExpenses = parseFloat(expenses.total_expenses || 0);

      const grossProfit = totalRevenue - totalCOGS;
      const netProfit = grossProfit - totalExpenses;
      const grossProfitMargin =
        totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netProfitMargin =
        totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      res.json({
        success: true,
        data: {
          period: {
            startDate,
            endDate,
          },
          revenue: {
            totalTransactions: revenue.total_transactions || 0,
            totalRevenue: totalRevenue,
            netRevenue: parseFloat(revenue.net_revenue || 0),
            totalTax: parseFloat(revenue.total_tax || 0),
            totalDiscounts: parseFloat(revenue.total_discounts || 0),
          },
          costs: {
            costOfGoodsSold: totalCOGS,
            totalExpenses: totalExpenses,
            expenseCount: expenses.total_expense_count || 0,
          },
          profit: {
            grossProfit: grossProfit,
            netProfit: netProfit,
            grossProfitMargin: grossProfitMargin,
            netProfitMargin: netProfitMargin,
          },
          expensesByCategory: expensesByCategory,
        },
      });
    } catch (error) {
      console.error('Profit & loss report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate profit & loss report',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get sales vs expenses trend (daily breakdown)
router.get('/trend', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.businessId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    const businessId = req.user.businessId;

    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const groupBy = (req.query.group_by as string) || 'day'; // day, week, month

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
      return;
    }

    let dateFormat = '%Y-%m-%d';
    if (groupBy === 'week') {
      dateFormat = '%Y-%u';
    } else if (groupBy === 'month') {
      dateFormat = '%Y-%m';
    }

    // Get daily sales
    const [salesTrend] = await pool.execute<any[]>(
      `SELECT 
        DATE_FORMAT(sale_date, ?) as period,
        COUNT(*) as transaction_count,
        SUM(total_amount) as revenue
      FROM sales
      WHERE business_id = ?
        AND status = 'completed'
        AND sale_date >= ?
        AND sale_date <= ?
      GROUP BY DATE_FORMAT(sale_date, ?)
      ORDER BY period`,
      [dateFormat, businessId, startDate, endDate, dateFormat],
    );

    // Get daily expenses
    const [expensesTrend] = await pool.execute<any[]>(
      `SELECT 
        DATE_FORMAT(expense_date, ?) as period,
        COUNT(*) as expense_count,
        SUM(amount) as expenses
      FROM expenses
      WHERE business_id = ?
        AND expense_date >= ?
        AND expense_date <= ?
      GROUP BY DATE_FORMAT(expense_date, ?)
      ORDER BY period`,
      [dateFormat, businessId, startDate, endDate, dateFormat],
    );

    // Merge the trends
    const trendMap = new Map();

    salesTrend.forEach((item: any) => {
      trendMap.set(item.period, {
        period: item.period,
        revenue: parseFloat(item.revenue || 0),
        transactionCount: item.transaction_count || 0,
        expenses: 0,
        expenseCount: 0,
      });
    });

    expensesTrend.forEach((item: any) => {
      const existing = trendMap.get(item.period) || {
        period: item.period,
        revenue: 0,
        transactionCount: 0,
        expenses: 0,
        expenseCount: 0,
      };
      existing.expenses = parseFloat(item.expenses || 0);
      existing.expenseCount = item.expense_count || 0;
      trendMap.set(item.period, existing);
    });

    const trend = Array.from(trendMap.values()).map(item => ({
      ...item,
      netProfit: item.revenue - item.expenses,
    }));

    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
          groupBy,
        },
        trend,
      },
    });
  } catch (error) {
    console.error('Trend report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate trend report',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Get top performing products by profit
router.get(
  '/top-products',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }
      const businessId = req.user.businessId;

      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
        return;
      }

      const [topProducts] = await pool.execute<any[]>(
        `SELECT 
        si.product_id,
        si.product_name,
        COUNT(DISTINCT s.id) as sale_count,
        SUM(si.quantity) as total_quantity_sold,
        SUM(si.total_price) as total_revenue,
        SUM(si.quantity * p.buying_price) as total_cost,
        SUM(si.total_price - (si.quantity * p.buying_price)) as total_profit,
        ROUND(((SUM(si.total_price - (si.quantity * p.buying_price)) / SUM(si.total_price)) * 100), 2) as profit_margin
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.business_id = ?
        AND s.status = 'completed'
        AND s.sale_date >= ?
        AND s.sale_date <= ?
      GROUP BY si.product_id, si.product_name
      ORDER BY total_profit DESC
      LIMIT ?`,
        [businessId, startDate, endDate, limit],
      );

      res.json({
        success: true,
        data: topProducts,
      });
    } catch (error) {
      console.error('Top products report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate top products report',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

export default router;
