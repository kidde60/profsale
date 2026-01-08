// routes/dashboard.routes.ts - Dashboard and business overview endpoints
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Get main dashboard overview
router.get(
  '/overview',
  authenticateToken,
  requirePermission('view_dashboard'),
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      // Get today's statistics
      const [todayStats] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(AVG(s.total_amount), 0) as average_transaction,
        COUNT(DISTINCT s.customer_id) as unique_customers
      FROM sales s
      WHERE s.business_id = ? AND DATE(s.sale_date) = ? AND s.status = 'completed'`,
        [businessId, today],
      );

      // Get today's top products
      const [todayTopProducts] = await pool.execute<any[]>(
        `SELECT 
        si.product_name,
        SUM(si.quantity) as total_sold,
        SUM(si.total_price) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.business_id = ? AND DATE(s.sale_date) = ? AND s.status = 'completed'
      GROUP BY si.product_id, si.product_name
      ORDER BY total_sold DESC
      LIMIT 5`,
        [businessId, today],
      );

      // Get today's payment method breakdown
      const [todayPaymentMethods] = await pool.execute<any[]>(
        `SELECT 
        s.payment_method,
        COUNT(*) as transaction_count,
        SUM(s.total_amount) as total_amount,
        ROUND((SUM(s.total_amount) / NULLIF((SELECT SUM(total_amount) FROM sales WHERE business_id = ? AND DATE(sale_date) = ? AND status = 'completed'), 0)) * 100, 2) as percentage
      FROM sales s
      WHERE s.business_id = ? AND DATE(s.sale_date) = ? AND s.status = 'completed'
      GROUP BY s.payment_method`,
        [businessId, today, businessId, today],
      );

      // Get this month's statistics
      const [monthStats] = await pool.execute<any[]>(
        `SELECT 
        COUNT(DISTINCT s.id) as total_transactions,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM((si.unit_price - COALESCE(p.buying_price, 0)) * si.quantity), 0) as total_profit
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.business_id = ? AND DATE_FORMAT(s.sale_date, '%Y-%m') = ? AND s.status = 'completed'`,
        [businessId, thisMonth],
      );

      // Get this week's statistics
      const [weekStats] = await pool.execute<any[]>(
        `SELECT 
        COUNT(DISTINCT s.id) as total_transactions,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM((si.unit_price - COALESCE(p.buying_price, 0)) * si.quantity), 0) as total_profit
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.business_id = ? AND YEARWEEK(s.sale_date) = YEARWEEK(NOW()) AND s.status = 'completed'`,
        [businessId],
      );

      // Get inventory overview
      const [inventoryStats] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN p.current_stock = 0 THEN 1 END) as out_of_stock,
        COUNT(CASE WHEN p.current_stock <= p.min_stock_level THEN 1 END) as low_stock,
        SUM(p.current_stock * p.buying_price) as inventory_value
      FROM products p
      WHERE p.business_id = ? AND p.is_active = TRUE`,
        [businessId],
      );

      // Get customer overview
      const [customerStats] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN c.last_purchase_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_customers,
        COUNT(CASE WHEN c.customer_type = 'vip' THEN 1 END) as vip_customers
      FROM customers c
      WHERE c.business_id = ? AND c.is_active = TRUE`,
        [businessId],
      );

      // Get recent sales
      const [recentSales] = await pool.execute<any[]>(
        `SELECT 
        s.id, s.sale_number, s.total_amount, s.sale_date, s.payment_method,
        s.customer_name,
        COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.business_id = ? AND s.status = 'completed'
      GROUP BY s.id
      ORDER BY s.sale_date DESC
      LIMIT 10`,
        [businessId],
      );

      res.json({
        success: true,
        data: {
          today: {
            date: today,
            ...todayStats[0],
            topProducts: todayTopProducts,
            paymentMethods: todayPaymentMethods,
          },
          week: {
            ...weekStats[0],
          },
          month: {
            month: thisMonth,
            ...monthStats[0],
          },
          inventory: inventoryStats[0],
          customers: customerStats[0],
          recentSales,
        },
      });
    } catch (error) {
      console.error('Dashboard overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard overview',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get sales trends (daily/weekly/monthly)
router.get(
  '/trends',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const period = (req.query.period as string) || 'week'; // day, week, month
      const days = parseInt(req.query.days as string) || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let groupBy = '';
      let dateFormat = '';

      switch (period) {
        case 'day':
          groupBy = 'DATE(s.sale_date)';
          dateFormat = 'DATE(s.sale_date) as period';
          break;
        case 'week':
          groupBy = 'YEARWEEK(s.sale_date)';
          dateFormat =
            'CONCAT(YEAR(s.sale_date), "-W", LPAD(WEEK(s.sale_date), 2, "0")) as period';
          break;
        case 'month':
          groupBy = 'DATE_FORMAT(s.sale_date, "%Y-%m")';
          dateFormat = 'DATE_FORMAT(s.sale_date, "%Y-%m") as period';
          break;
        default:
          groupBy = 'DATE(s.sale_date)';
          dateFormat = 'DATE(s.sale_date) as period';
      }

      // Get sales trends
      const [salesTrends] = await pool.execute<any[]>(
        `SELECT 
        ${dateFormat},
        COUNT(*) as transaction_count,
        SUM(s.total_amount) as revenue,
        AVG(s.total_amount) as avg_transaction,
        COUNT(DISTINCT s.customer_id) as unique_customers
      FROM sales s
      WHERE s.business_id = ? AND s.sale_date >= ? AND s.status = 'completed'
      GROUP BY ${groupBy}
      ORDER BY period ASC`,
        [businessId, startDate.toISOString()],
      );

      // Get product performance trends
      const [productTrends] = await pool.execute<any[]>(
        `SELECT 
        ${dateFormat},
        si.product_name,
        SUM(si.quantity) as quantity_sold,
        SUM(si.total_price) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.business_id = ? AND s.sale_date >= ? AND s.status = 'completed'
      GROUP BY ${groupBy}, si.product_id, si.product_name
      ORDER BY period ASC, revenue DESC`,
        [businessId, startDate.toISOString()],
      );

      // Calculate growth rates
      const growth = calculateGrowthRates(salesTrends);

      res.json({
        success: true,
        data: {
          period,
          days,
          salesTrends,
          productTrends,
          growth,
        },
      });
    } catch (error) {
      console.error('Dashboard trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trends data',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get business metrics and KPIs
router.get(
  '/metrics',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const period = (req.query.period as string) || 'month'; // week, month, quarter, year

      let dateCondition = '';
      let previousDateCondition = '';

      switch (period) {
        case 'week':
          dateCondition =
            'DATE(s.sale_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          previousDateCondition =
            'DATE(s.sale_date) >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE(s.sale_date) < DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
          break;
        case 'month':
          dateCondition =
            'DATE_FORMAT(s.sale_date, "%Y-%m") = DATE_FORMAT(CURDATE(), "%Y-%m")';
          previousDateCondition =
            'DATE_FORMAT(s.sale_date, "%Y-%m") = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), "%Y-%m")';
          break;
        case 'quarter':
          dateCondition =
            'QUARTER(s.sale_date) = QUARTER(CURDATE()) AND YEAR(s.sale_date) = YEAR(CURDATE())';
          previousDateCondition =
            'QUARTER(s.sale_date) = QUARTER(DATE_SUB(CURDATE(), INTERVAL 3 MONTH)) AND YEAR(s.sale_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 3 MONTH))';
          break;
        case 'year':
          dateCondition = 'YEAR(s.sale_date) = YEAR(CURDATE())';
          previousDateCondition =
            'YEAR(s.sale_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 YEAR))';
          break;
      }

      // Current period metrics
      const [currentMetrics] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(AVG(s.total_amount), 0) as avg_sale_value,
        COUNT(DISTINCT s.customer_id) as unique_customers,
        COUNT(DISTINCT DATE(s.sale_date)) as active_days
      FROM sales s
      WHERE s.business_id = ? AND ${dateCondition} AND s.status = 'completed'`,
        [businessId],
      );

      // Previous period metrics for comparison
      const [previousMetrics] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(AVG(s.total_amount), 0) as avg_sale_value,
        COUNT(DISTINCT s.customer_id) as unique_customers
      FROM sales s
      WHERE s.business_id = ? AND ${previousDateCondition} AND s.status = 'completed'`,
        [businessId],
      );

      // Calculate profit margins
      const [profitData] = await pool.execute<any[]>(
        `SELECT 
        COALESCE(SUM(si.total_price), 0) as total_revenue,
        COALESCE(SUM(si.quantity * COALESCE(si.cost_price, 0)), 0) as total_cost,
        COALESCE(SUM((si.unit_price - COALESCE(si.cost_price, 0)) * si.quantity), 0) as total_profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.business_id = ? AND ${dateCondition} AND s.status = 'completed'`,
        [businessId],
      );

      // Calculate inventory turnover
      const [inventoryTurnover] = await pool.execute<any[]>(
        `SELECT 
        COALESCE(SUM(si.quantity * si.cost_price), 0) as cost_of_goods_sold,
        COALESCE(AVG(p.current_stock * p.buying_price), 0) as avg_inventory_value
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.business_id = ? AND ${dateCondition} AND s.status = 'completed'`,
        [businessId],
      );

      // Calculate percentage changes
      const current = currentMetrics[0];
      const previous = previousMetrics[0];
      const profit = profitData[0];

      const revenueGrowth =
        previous.total_revenue > 0
          ? ((current.total_revenue - previous.total_revenue) /
              previous.total_revenue) *
            100
          : 0;

      const salesGrowth =
        previous.total_sales > 0
          ? ((current.total_sales - previous.total_sales) /
              previous.total_sales) *
            100
          : 0;

      const customerGrowth =
        previous.unique_customers > 0
          ? ((current.unique_customers - previous.unique_customers) /
              previous.unique_customers) *
            100
          : 0;

      const profitMargin =
        profit.total_revenue > 0
          ? (profit.total_profit / profit.total_revenue) * 100
          : 0;

      const inventoryTurnoverRatio =
        inventoryTurnover[0].avg_inventory_value > 0
          ? inventoryTurnover[0].cost_of_goods_sold /
            inventoryTurnover[0].avg_inventory_value
          : 0;

      // Get top performing products
      const [topProducts] = await pool.execute<any[]>(
        `SELECT 
        si.product_name,
        SUM(si.quantity) as total_sold,
        SUM(si.total_price) as total_revenue,
        SUM((si.unit_price - COALESCE(si.cost_price, 0)) * si.quantity) as total_profit,
        COUNT(DISTINCT si.sale_id) as number_of_sales
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.business_id = ? AND ${dateCondition} AND s.status = 'completed'
      GROUP BY si.product_id, si.product_name
      ORDER BY total_revenue DESC
      LIMIT 10`,
        [businessId],
      );

      // Get customer insights
      const [customerInsights] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as new_customers,
        COUNT(CASE WHEN c.customer_type = 'vip' THEN 1 END) as new_vip_customers,
        AVG(c.total_purchases) as avg_customer_value
      FROM customers c
      WHERE c.business_id = ? AND ${dateCondition.replace('s.sale_date', 'c.created_at')}`,
        [businessId],
      );

      res.json({
        success: true,
        data: {
          period,
          current: current,
          previous: previous,
          growth: {
            revenue: Math.round(revenueGrowth * 100) / 100,
            sales: Math.round(salesGrowth * 100) / 100,
            customers: Math.round(customerGrowth * 100) / 100,
          },
          profitability: {
            totalProfit: profit.total_profit,
            profitMargin: Math.round(profitMargin * 100) / 100,
            totalCost: profit.total_cost,
          },
          efficiency: {
            inventoryTurnover: Math.round(inventoryTurnoverRatio * 100) / 100,
            avgSalesPerDay:
              current.active_days > 0
                ? Math.round(
                    (current.total_sales / current.active_days) * 100,
                  ) / 100
                : 0,
            avgRevenuePerDay:
              current.active_days > 0
                ? Math.round(
                    (current.total_revenue / current.active_days) * 100,
                  ) / 100
                : 0,
          },
          topProducts,
          customerInsights: customerInsights[0],
        },
      });
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch business metrics',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get alerts and notifications
router.get(
  '/alerts',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const alerts = [];

      // Low stock alerts
      const [lowStockProducts] = await pool.execute<any[]>(
        `SELECT p.id, p.name, p.current_stock, p.min_stock_level
      FROM products p
      WHERE p.business_id = ? AND p.is_active = TRUE 
      AND p.current_stock <= p.min_stock_level
      ORDER BY p.current_stock ASC`,
        [businessId],
      );

      lowStockProducts.forEach((product: any) => {
        alerts.push({
          type: product.current_stock === 0 ? 'error' : 'warning',
          category: 'inventory',
          title:
            product.current_stock === 0 ? 'Out of Stock' : 'Low Stock Alert',
          message: `${product.name} ${product.current_stock === 0 ? 'is out of stock' : `only has ${product.current_stock} units left`}`,
          data: product,
          priority: product.current_stock === 0 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
        });
      });

      // Inactive customers (no purchase in 60 days)
      const [inactiveCustomers] = await pool.execute<any[]>(
        `SELECT c.id, c.name, c.phone, c.last_purchase_date,
       DATEDIFF(NOW(), c.last_purchase_date) as days_inactive
      FROM customers c
      WHERE c.business_id = ? AND c.is_active = TRUE
      AND c.last_purchase_date < DATE_SUB(NOW(), INTERVAL 60 DAY)
      AND c.total_purchases > 50000
      ORDER BY c.total_purchases DESC
      LIMIT 5`,
        [businessId],
      );

      inactiveCustomers.forEach((customer: any) => {
        alerts.push({
          type: 'info',
          category: 'customer',
          title: 'Inactive High-Value Customer',
          message: `${customer.name} hasn't purchased in ${customer.days_inactive} days`,
          data: customer,
          priority: 'medium',
          timestamp: new Date().toISOString(),
        });
      });

      // Sales performance alerts
      const [todaySales] = await pool.execute<any[]>(
        `SELECT COUNT(*) as today_sales, COALESCE(SUM(total_amount), 0) as today_revenue
      FROM sales 
      WHERE business_id = ? AND DATE(sale_date) = CURDATE() AND status = 'completed'`,
        [businessId],
      );

      const [avgDailySales] = await pool.execute<any[]>(
        `SELECT AVG(daily_sales) as avg_sales, AVG(daily_revenue) as avg_revenue
      FROM (
        SELECT DATE(sale_date) as date, COUNT(*) as daily_sales, SUM(total_amount) as daily_revenue
        FROM sales 
        WHERE business_id = ? AND DATE(sale_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
        AND status = 'completed'
        GROUP BY DATE(sale_date)
      ) daily_stats`,
        [businessId],
      );

      const todayPerformance = todaySales[0];
      const avgPerformance = avgDailySales[0];

      if (
        avgPerformance.avg_sales > 0 &&
        todayPerformance.today_sales < avgPerformance.avg_sales * 0.5
      ) {
        alerts.push({
          type: 'warning',
          category: 'sales',
          title: 'Low Sales Today',
          message: `Today's sales (${todayPerformance.today_sales}) are below average (${Math.round(avgPerformance.avg_sales)})`,
          data: { today: todayPerformance, average: avgPerformance },
          priority: 'medium',
          timestamp: new Date().toISOString(),
        });
      }

      // Positive alerts
      if (todayPerformance.today_revenue > avgPerformance.avg_revenue * 1.5) {
        alerts.push({
          type: 'success',
          category: 'sales',
          title: 'Great Sales Day!',
          message: `Today's revenue (${Math.round(todayPerformance.today_revenue).toLocaleString()} UGX) is above average!`,
          data: { today: todayPerformance, average: avgPerformance },
          priority: 'low',
          timestamp: new Date().toISOString(),
        });
      }

      // Sort alerts by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      alerts.sort(
        (a, b) =>
          priorityOrder[b.priority as keyof typeof priorityOrder] -
          priorityOrder[a.priority as keyof typeof priorityOrder],
      );

      res.json({
        success: true,
        data: {
          alerts,
          summary: {
            total: alerts.length,
            high: alerts.filter(a => a.priority === 'high').length,
            medium: alerts.filter(a => a.priority === 'medium').length,
            low: alerts.filter(a => a.priority === 'low').length,
          },
        },
      });
    } catch (error) {
      console.error('Dashboard alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch alerts',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get quick stats for widgets
router.get(
  '/quick-stats',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = (req as any).user.businessId;
      const today = new Date().toISOString().split('T')[0];

      // Today's quick stats
      const [quickStats] = await pool.execute<any[]>(
        `SELECT 
        'today_sales' as metric,
        COUNT(*) as value,
        'transactions' as unit
      FROM sales s
      WHERE s.business_id = ? AND DATE(s.sale_date) = ? AND s.status = 'completed'
      
      UNION ALL
      
      SELECT 
        'today_revenue' as metric,
        COALESCE(SUM(s.total_amount), 0) as value,
        'UGX' as unit
      FROM sales s
      WHERE s.business_id = ? AND DATE(s.sale_date) = ? AND s.status = 'completed'
      
      UNION ALL
      
      SELECT 
        'low_stock_products' as metric,
        COUNT(*) as value,
        'products' as unit
      FROM products p
      WHERE p.business_id = ? AND p.is_active = TRUE 
      AND p.current_stock <= p.min_stock_level
      
      UNION ALL
      
      SELECT 
        'total_customers' as metric,
        COUNT(*) as value,
        'customers' as unit
      FROM customers c
      WHERE c.business_id = ? AND c.is_active = TRUE`,
        [businessId, today, businessId, today, businessId, businessId],
      );

      // Convert to object format
      const stats: any = {};
      quickStats.forEach((stat: any) => {
        stats[stat.metric] = {
          value: stat.value,
          unit: stat.unit,
        };
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Quick stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quick stats',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Helper function to calculate growth rates
function calculateGrowthRates(trendsData: any[]) {
  if (trendsData.length < 2) return { revenue: 0, transactions: 0 };

  const latest = trendsData[trendsData.length - 1];
  const previous = trendsData[trendsData.length - 2];

  const revenueGrowth =
    previous.revenue > 0
      ? ((latest.revenue - previous.revenue) / previous.revenue) * 100
      : 0;

  const transactionGrowth =
    previous.transaction_count > 0
      ? ((latest.transaction_count - previous.transaction_count) /
          previous.transaction_count) *
        100
      : 0;

  return {
    revenue: Math.round(revenueGrowth * 100) / 100,
    transactions: Math.round(transactionGrowth * 100) / 100,
  };
}

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Dashboard routes are working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
