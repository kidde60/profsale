// routes/sales.routes.ts - Sales/POS management endpoints
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Generate unique sale number
const generateSaleNumber = (businessId: number): string => {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const timeStr =
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');

  return `PS${businessId}${dateStr}${timeStr}`;
};

// Create new sale (POS transaction)
router.post(
  '/',
  authenticateToken,
  requirePermission('create_sale'),
  async (req: Request, res: Response) => {
    try {
      // Use businessId from request body, but can validate against user's businessId in production
      const businessId = req.body.businessId || req.user?.businessId;
      const employeeId = req.user?.id;

      const {
        customerId,
        customerName,
        customerPhone,
        items,
        paymentMethod = 'cash',
        paymentReference,
        discountAmount = 0,
        taxRate = 0,
        notes,
      } = req.body;

      // Validation
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'At least one item is required for sale',
        });
        return;
      }

      // Validate each item
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          res.status(400).json({
            success: false,
            message: 'Each item must have productId, quantity, and unitPrice',
          });
          return;
        }

        if (item.quantity <= 0 || item.unitPrice <= 0) {
          res.status(400).json({
            success: false,
            message: 'Quantity and unit price must be positive',
          });
          return;
        }
      }

      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // 1. Check product availability and get product details
        const productIds = items.map((item: any) => item.productId);
        console.log(
          'Looking for products:',
          productIds,
          'for business:',
          businessId,
        );

        const [products] = await connection.execute<any[]>(
          `SELECT id, name, barcode, current_stock, buying_price, selling_price 
         FROM products 
         WHERE id IN (${productIds.map(() => '?').join(',')}) 
         AND business_id = ? AND is_active = TRUE`,
          [...productIds, businessId],
        );

        console.log(
          'Found products:',
          products.length,
          'Expected:',
          productIds.length,
        );

        if (products.length !== productIds.length) {
          // Find which products are missing
          const foundIds = products.map((p: any) => p.id);
          const missingIds = productIds.filter(
            (id: number) => !foundIds.includes(id),
          );
          console.log('Missing product IDs:', missingIds);

          res.status(400).json({
            success: false,
            message: `One or more products not found: ${missingIds.join(', ')}`,
          });
          await connection.rollback();
          connection.release();
          return;
        }

        // Check stock availability
        for (const item of items) {
          const product = products.find(p => p.id === item.productId);
          if (product.current_stock < item.quantity) {
            res.status(400).json({
              success: false,
              message: `Insufficient stock for ${product.name}. Available: ${product.current_stock}, Requested: ${item.quantity}`,
            });
            await connection.rollback();
            connection.release();
            return;
          }
        }

        // 2. Calculate totals
        let subtotal = 0;
        const saleItems = items.map((item: any) => {
          const product = products.find(p => p.id === item.productId);
          const totalPrice = item.quantity * item.unitPrice;
          subtotal += totalPrice;

          return {
            productId: item.productId,
            productName: product.name,
            productBarcode: product.barcode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice,
            costPrice: product.buying_price,
          };
        });

        const taxAmount = subtotal * (taxRate || 0);
        const totalAmount = subtotal + taxAmount - (discountAmount || 0);

        // 3. Generate sale number
        const saleNumber = generateSaleNumber(businessId);

        // 4. Create sale record
        const [saleResult] = await connection.execute<any>(
          `INSERT INTO sales 
        (business_id, employee_id, customer_id, sale_number, customer_name, customer_phone,
         subtotal, tax_amount, discount_amount, total_amount, amount_paid, change_amount,
         payment_method, payment_reference, status, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
          [
            businessId,
            employeeId,
            customerId || null,
            saleNumber,
            customerName || null,
            customerPhone || null,
            subtotal,
            taxAmount,
            discountAmount || 0,
            totalAmount,
            totalAmount,
            0, // For now, assume exact payment
            paymentMethod,
            paymentReference || null,
            notes || null,
          ],
        );

        const saleId = saleResult.insertId;

        // 5. Create sale items
        for (const saleItem of saleItems) {
          await connection.execute(
            `INSERT INTO sale_items 
          (sale_id, product_id, product_name, product_barcode, quantity, 
           unit_price, total_price, cost_price) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              saleId,
              saleItem.productId,
              saleItem.productName,
              saleItem.productBarcode,
              saleItem.quantity,
              saleItem.unitPrice,
              saleItem.totalPrice,
              saleItem.costPrice,
            ],
          );

          // 6. Update product stock
          await connection.execute(
            'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
            [saleItem.quantity, saleItem.productId],
          );

          // 7. Create inventory movement
          const [stockResult] = await connection.execute<any[]>(
            'SELECT current_stock FROM products WHERE id = ?',
            [saleItem.productId],
          );
          const stockAfter = stockResult[0]?.current_stock || 0;
          const stockBefore = stockAfter + saleItem.quantity;

          await connection.execute(
            `INSERT INTO inventory_movements 
          (business_id, product_id, movement_type, quantity_change, 
           stock_before, stock_after, reference_id, created_by, notes) 
          VALUES (?, ?, 'sale', ?, ?, ?, ?, ?, ?)`,
            [
              businessId,
              saleItem.productId,
              -saleItem.quantity,
              stockBefore,
              stockAfter,
              saleId,
              employeeId,
              `Sale #${saleNumber}`,
            ],
          );
        }

        // 8. Update customer totals if customer exists
        if (customerId) {
          await connection.execute(
            `UPDATE customers 
          SET total_purchases = total_purchases + ?, 
              total_orders = total_orders + 1,
              last_purchase_date = CURRENT_TIMESTAMP 
          WHERE id = ? AND business_id = ?`,
            [totalAmount, customerId, businessId],
          );
        }

        await connection.commit();

        // 9. Get complete sale data for response
        const [completeSale] = await pool.execute<any[]>(
          `SELECT 
          s.*, c.name as customer_name_full,
          u.first_name, u.last_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.employee_id = u.id
        WHERE s.id = ?`,
          [saleId],
        );

        const [completeSaleItems] = await pool.execute<any[]>(
          'SELECT * FROM sale_items WHERE sale_id = ?',
          [saleId],
        );

        res.status(201).json({
          success: true,
          message: 'Sale completed successfully',
          data: {
            sale: {
              ...completeSale[0],
              items: completeSaleItems,
              profit: saleItems.reduce(
                (total, item) =>
                  total + (item.unitPrice - item.costPrice) * item.quantity,
                0,
              ),
            },
          },
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Create sale error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process sale',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get all sales with filtering and pagination
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const businessId = req?.user?.businessId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    // Filters
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const paymentMethod = req.query.payment_method as string;
    const status = req.query.status as string;
    const employeeId = req.query.employee_id as string;

    // Build WHERE clause
    let whereClause = 'WHERE s.business_id = ?';
    let queryParams: any[] = [businessId];

    if (startDate) {
      whereClause += ' AND DATE(s.sale_date) >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(s.sale_date) <= ?';
      queryParams.push(endDate);
    }

    if (paymentMethod) {
      whereClause += ' AND s.payment_method = ?';
      queryParams.push(paymentMethod);
    }

    if (status) {
      whereClause += ' AND s.status = ?';
      queryParams.push(status);
    }

    if (employeeId) {
      whereClause += ' AND s.employee_id = ?';
      queryParams.push(parseInt(employeeId));
    }

    // Get total count
    const [countResult] = await pool.execute<any[]>(
      `SELECT COUNT(*) as total FROM sales s ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get sales
    const [sales] = await pool.execute<any[]>(
      `SELECT 
        s.id, s.sale_number, s.customer_name, s.subtotal, s.tax_amount,
        s.discount_amount, s.total_amount, s.payment_method, s.status,
        s.sale_date, s.created_at,
        u.first_name as employee_first_name, u.last_name as employee_last_name,
        c.name as customer_full_name,
        COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN users u ON s.employee_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.sale_date DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    // Get summary statistics
    const [summary] = await pool.execute<any[]>(
      `SELECT 
        COUNT(*) as total_sales,
        SUM(s.total_amount) as total_revenue,
        AVG(s.total_amount) as average_sale,
        SUM(CASE WHEN s.payment_method = 'cash' THEN s.total_amount ELSE 0 END) as cash_sales,
        SUM(CASE WHEN s.payment_method = 'mobile_money' THEN s.total_amount ELSE 0 END) as mobile_money_sales
      FROM sales s
      ${whereClause}`,
      queryParams,
    );

    res.json({
      success: true,
      data: {
        sales,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
        summary: summary[0],
      },
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Get single sale details
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const saleIdParam = req.params.id;

    if (!saleIdParam) {
      res.status(400).json({
        success: false,
        message: 'Sale ID is required',
      });
      return;
    }

    const saleId = parseInt(saleIdParam);

    if (isNaN(saleId)) {
      res.status(400).json({
        success: false,
        message: 'Valid sale ID is required',
      });
      return;
    }

    // Get sale details
    const [sales] = await pool.execute<any[]>(
      `SELECT 
        s.*, 
        u.first_name as employee_first_name, u.last_name as employee_last_name,
        c.name as customer_full_name, c.phone as customer_full_phone,
        c.email as customer_email, c.customer_type
      FROM sales s
      LEFT JOIN users u ON s.employee_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ? AND s.business_id = ?`,
      [saleId, businessId],
    );

    if (sales.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
      return;
    }

    // Get sale items
    const [saleItems] = await pool.execute<any[]>(
      `SELECT 
        si.*,
        p.name as product_name,
        p.barcode as product_barcode,
        p.current_stock as current_product_stock
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?`,
      [saleId],
    );

    // Calculate profit
    const totalProfit = saleItems.reduce(
      (total: number, item: any) =>
        total + (item.unit_price - (item.cost_price || 0)) * item.quantity,
      0,
    );

    res.json({
      success: true,
      data: {
        sale: {
          ...sales[0],
          items: saleItems,
          totalProfit,
        },
      },
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sale',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Get daily sales summary
router.get(
  '/reports/daily',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = req.user?.businessId;
      const date =
        (req.query.date as string) || new Date().toISOString().split('T')[0];

      const [dailySales] = await pool.execute<any[]>(
        `SELECT 
        DATE(s.sale_date) as sale_date,
        COUNT(*) as total_transactions,
        SUM(s.total_amount) as total_revenue,
        SUM(s.subtotal) as subtotal,
        SUM(s.tax_amount) as total_tax,
        SUM(s.discount_amount) as total_discounts,
        AVG(s.total_amount) as average_transaction,
        COUNT(DISTINCT s.customer_id) as unique_customers,
        SUM(CASE WHEN s.payment_method = 'cash' THEN s.total_amount ELSE 0 END) as cash_sales,
        SUM(CASE WHEN s.payment_method = 'mobile_money' THEN s.total_amount ELSE 0 END) as mobile_money_sales,
        SUM(CASE WHEN s.payment_method = 'bank_transfer' THEN s.total_amount ELSE 0 END) as bank_transfer_sales
      FROM sales s
      WHERE s.business_id = ? AND DATE(s.sale_date) = ? AND s.status = 'completed'
      GROUP BY DATE(s.sale_date)`,
        [businessId, date],
      );

      // Get top selling products for the day
      const [topProducts] = await pool.execute<any[]>(
        `SELECT 
        si.product_name,
        SUM(si.quantity) as total_sold,
        SUM(si.total_price) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.business_id = ? AND DATE(s.sale_date) = ? AND s.status = 'completed'
      GROUP BY si.product_id, si.product_name
      ORDER BY total_sold DESC
      LIMIT 5`,
        [businessId, date],
      );

      // Get hourly sales distribution
      const [hourlySales] = await pool.execute<any[]>(
        `SELECT 
        HOUR(s.sale_date) as hour,
        COUNT(*) as transaction_count,
        SUM(s.total_amount) as revenue
      FROM sales s
      WHERE s.business_id = ? AND DATE(s.sale_date) = ? AND s.status = 'completed'
      GROUP BY HOUR(s.sale_date)
      ORDER BY hour`,
        [businessId, date],
      );

      res.json({
        success: true,
        data: {
          date,
          summary: dailySales[0] || {
            sale_date: date,
            total_transactions: 0,
            total_revenue: 0,
            average_transaction: 0,
            unique_customers: 0,
          },
          topProducts,
          hourlySales,
        },
      });
    } catch (error) {
      console.error('Daily sales report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate daily sales report',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Cancel/Refund sale
router.put(
  '/:id/cancel',
  authenticateToken,
  requirePermission('refund_sale'),
  async (req: Request, res: Response) => {
    try {
      const businessId = req.user?.businessId;
      const employeeId = req.user?.id;
      const saleIdParam = req.params.id;
      const { reason } = req.body;

      if (!saleIdParam) {
        res.status(400).json({
          success: false,
          message: 'Sale ID is required',
        });
        return;
      }

      const saleId = parseInt(saleIdParam);

      if (isNaN(saleId)) {
        res.status(400).json({
          success: false,
          message: 'Valid sale ID is required',
        });
        return;
      }

      // Check if sale exists and can be cancelled
      const [sales] = await pool.execute<any[]>(
        'SELECT * FROM sales WHERE id = ? AND business_id = ? AND status = "completed"',
        [saleId, businessId],
      );

      if (sales.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Sale not found or cannot be cancelled',
        });
        return;
      }

      // Start transaction to reverse the sale
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Get sale items to restore stock
        const [saleItems] = await connection.execute<any[]>(
          'SELECT * FROM sale_items WHERE sale_id = ?',
          [saleId],
        );

        // Restore stock for each item
        for (const item of saleItems) {
          await connection.execute(
            'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
            [item.quantity, item.product_id],
          );

          // Create inventory movement for stock restoration
          const [stockResult] = await connection.execute<any[]>(
            'SELECT current_stock FROM products WHERE id = ?',
            [item.product_id],
          );
          const stockAfter = stockResult[0]?.current_stock || 0;
          const stockBefore = stockAfter - item.quantity;

          await connection.execute(
            `INSERT INTO inventory_movements 
          (business_id, product_id, movement_type, quantity_change, 
           stock_before, stock_after, reference_id, created_by, notes) 
          VALUES (?, ?, 'return', ?, ?, ?, ?, ?, ?)`,
            [
              businessId,
              item.product_id,
              item.quantity,
              stockBefore,
              stockAfter,
              saleId,
              employeeId,
              `Sale cancellation: ${reason || 'No reason provided'}`,
            ],
          );
        }

        // Update sale status
        await connection.execute(
          'UPDATE sales SET status = "cancelled", notes = CONCAT(COALESCE(notes, ""), " | Cancelled: ", ?) WHERE id = ?',
          [reason || 'No reason provided', saleId],
        );

        // Update customer totals if customer exists
        const sale = sales[0];
        if (sale.customer_id) {
          await connection.execute(
            `UPDATE customers 
          SET total_purchases = total_purchases - ?, 
              total_orders = total_orders - 1
          WHERE id = ? AND business_id = ?`,
            [sale.total_amount, sale.customer_id, businessId],
          );
        }

        await connection.commit();

        res.json({
          success: true,
          message: 'Sale cancelled successfully',
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Cancel sale error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel sale',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get sales analytics
router.get(
  '/reports/analytics',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = req.user?.businessId;
      const startDate =
        (req.query.start_date as string) ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
      const endDate =
        (req.query.end_date as string) ||
        new Date().toISOString().split('T')[0];

      // Get overall analytics
      const [analytics] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_sales,
        SUM(s.total_amount) as total_revenue,
        SUM(s.subtotal) as total_subtotal,
        SUM(s.tax_amount) as total_tax,
        SUM(s.discount_amount) as total_discounts,
        AVG(s.total_amount) as average_sale,
        COUNT(DISTINCT s.customer_id) as unique_customers,
        COUNT(DISTINCT DATE(s.sale_date)) as active_days
      FROM sales s
      WHERE s.business_id = ? AND DATE(s.sale_date) BETWEEN ? AND ? AND s.status = 'completed'`,
        [businessId, startDate, endDate],
      );

      // Get payment method breakdown
      const [paymentMethods] = await pool.execute<any[]>(
        `SELECT 
        s.payment_method,
        COUNT(*) as transaction_count,
        SUM(s.total_amount) as total_amount,
        ROUND((SUM(s.total_amount) / (SELECT SUM(total_amount) FROM sales WHERE business_id = ? AND DATE(sale_date) BETWEEN ? AND ? AND status = 'completed')) * 100, 2) as percentage
      FROM sales s
      WHERE s.business_id = ? AND DATE(s.sale_date) BETWEEN ? AND ? AND s.status = 'completed'
      GROUP BY s.payment_method`,
        [businessId, startDate, endDate, businessId, startDate, endDate],
      );

      // Get top selling products
      const [topProducts] = await pool.execute<any[]>(
        `SELECT 
        si.product_name,
        SUM(si.quantity) as total_sold,
        SUM(si.total_price) as total_revenue,
        COUNT(DISTINCT si.sale_id) as times_sold,
        AVG(si.unit_price) as avg_price
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.business_id = ? AND DATE(s.sale_date) BETWEEN ? AND ? AND s.status = 'completed'
      GROUP BY si.product_id, si.product_name
      ORDER BY total_sold DESC
      LIMIT 10`,
        [businessId, startDate, endDate],
      );

      // Get daily sales trend
      const [dailyTrend] = await pool.execute<any[]>(
        `SELECT 
        DATE(s.sale_date) as date,
        COUNT(*) as transactions,
        SUM(s.total_amount) as revenue
      FROM sales s
      WHERE s.business_id = ? AND DATE(s.sale_date) BETWEEN ? AND ? AND s.status = 'completed'
      GROUP BY DATE(s.sale_date)
      ORDER BY date`,
        [businessId, startDate, endDate],
      );

      // Calculate total profit
      const [profitData] = await pool.execute<any[]>(
        `SELECT 
        SUM((si.unit_price - COALESCE(si.cost_price, 0)) * si.quantity) as total_profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.business_id = ? AND DATE(s.sale_date) BETWEEN ? AND ? AND s.status = 'completed'`,
        [businessId, startDate, endDate],
      );

      res.json({
        success: true,
        data: {
          period: {
            startDate,
            endDate,
          },
          analytics: {
            ...analytics[0],
            totalProfit: profitData[0].total_profit || 0,
          },
          paymentMethods,
          topProducts,
          dailyTrend,
        },
      });
    } catch (error) {
      console.error('Sales analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate sales analytics',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Generate receipt data
router.get(
  '/:id/receipt',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = req.user?.businessId;
      const saleIdParam = req.params.id;

      if (!saleIdParam) {
        res.status(400).json({
          success: false,
          message: 'Sale ID is required',
        });
        return;
      }

      const saleId = parseInt(saleIdParam);

      if (isNaN(saleId)) {
        res.status(400).json({
          success: false,
          message: 'Valid sale ID is required',
        });
        return;
      }

      // Get business details
      const [business] = await pool.execute<any[]>(
        'SELECT * FROM businesses WHERE id = ?',
        [businessId],
      );

      // Get sale and customer details
      const [sales] = await pool.execute<any[]>(
        `SELECT 
        s.*, 
        u.first_name as employee_first_name, u.last_name as employee_last_name,
        c.name as customer_full_name, c.phone as customer_full_phone
      FROM sales s
      LEFT JOIN users u ON s.employee_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ? AND s.business_id = ?`,
        [saleId, businessId],
      );

      if (sales.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Sale not found',
        });
        return;
      }

      // Get sale items
      const [saleItems] = await pool.execute<any[]>(
        'SELECT * FROM sale_items WHERE sale_id = ?',
        [saleId],
      );

      res.json({
        success: true,
        data: {
          business: business[0],
          sale: sales[0],
          items: saleItems,
          receiptNumber: sales[0].sale_number,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Generate receipt error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate receipt',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Sales routes are working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
