// routes/customers.routes.ts - Customer management endpoints
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Get all customers with filtering and pagination
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.businessId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    const businessId = req.user.businessId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    // Filters
    const search = req.query.search as string;
    const customerType = req.query.customer_type as string;
    const sortBy = (req.query.sort_by as string) || 'name';
    const sortOrder = (req.query.sort_order as string) || 'ASC';

    // Build WHERE clause
    let whereClause = 'WHERE c.business_id = ? AND c.is_active = TRUE';
    let queryParams: any[] = [businessId];

    if (search) {
      whereClause += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (customerType) {
      whereClause += ' AND c.customer_type = ?';
      queryParams.push(customerType);
    }

    // Validate sort options
    const allowedSortFields = [
      'name',
      'total_purchases',
      'total_orders',
      'last_purchase_date',
      'created_at',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDirection = ['ASC', 'DESC'].includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : 'ASC';

    // Get total count
    const [countResult] = await pool.execute<any[]>(
      `SELECT COUNT(*) as total FROM customers c ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get customers
    const [customers] = await pool.execute<any[]>(
      `SELECT 
        c.id, c.name, c.phone, c.email, c.address, c.customer_type,
        c.total_purchases, c.total_orders, c.last_purchase_date,
        c.created_at, c.updated_at,
        CASE 
          WHEN c.last_purchase_date IS NULL THEN 'new'
          WHEN c.last_purchase_date < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'inactive'
          WHEN c.total_purchases > 500000 THEN 'high_value'
          WHEN c.total_orders > 10 THEN 'frequent'
          ELSE 'regular'
        END as customer_status,
        DATEDIFF(NOW(), c.last_purchase_date) as days_since_last_purchase
      FROM customers c
      ${whereClause}
      ORDER BY c.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    // Get summary statistics
    const [summary] = await pool.execute<any[]>(
      `SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN c.customer_type = 'vip' THEN 1 END) as vip_customers,
        COUNT(CASE WHEN c.customer_type = 'wholesale' THEN 1 END) as wholesale_customers,
        COUNT(CASE WHEN c.last_purchase_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_customers,
        SUM(c.total_purchases) as total_customer_value,
        AVG(c.total_purchases) as average_customer_value
      FROM customers c
      WHERE c.business_id = ? AND c.is_active = TRUE`,
      [businessId],
    );

    res.json({
      success: true,
      data: {
        customers,
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
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Get single customer details
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.businessId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    const businessId = req.user.businessId;
    const customerIdParam = req.params.id;

    if (!customerIdParam) {
      res.status(400).json({
        success: false,
        message: 'Customer ID is required',
      });
      return;
    }

    const customerId = parseInt(customerIdParam);

    if (isNaN(customerId)) {
      res.status(400).json({
        success: false,
        message: 'Valid customer ID is required',
      });
      return;
    }

    // Get customer details
    const [customers] = await pool.execute<any[]>(
      `SELECT 
        c.id, c.name, c.phone, c.email, c.address, c.customer_type,
        c.total_purchases, c.total_orders, c.last_purchase_date,
        c.created_at, c.updated_at,
        CASE 
          WHEN c.last_purchase_date IS NULL THEN 'new'
          WHEN c.last_purchase_date < DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'inactive'
          WHEN c.total_purchases > 500000 THEN 'high_value'
          WHEN c.total_orders > 10 THEN 'frequent'
          ELSE 'regular'
        END as customer_status,
        DATEDIFF(NOW(), c.last_purchase_date) as days_since_last_purchase
      FROM customers c
      WHERE c.id = ? AND c.business_id = ? AND c.is_active = TRUE`,
      [customerId, businessId],
    );

    if (customers.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    const customer = customers[0];

    // Get recent purchases
    const [recentPurchases] = await pool.execute<any[]>(
      `SELECT 
        s.id, s.sale_number, s.total_amount, s.payment_method, s.sale_date,
        COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.customer_id = ? AND s.business_id = ? AND s.status = 'completed'
      GROUP BY s.id
      ORDER BY s.sale_date DESC
      LIMIT 10`,
      [customerId, businessId],
    );

    // Get favorite products
    const [favoriteProducts] = await pool.execute<any[]>(
      `SELECT 
        si.product_name,
        COUNT(*) as purchase_count,
        SUM(si.quantity) as total_quantity,
        SUM(si.total_price) as total_spent,
        MAX(s.sale_date) as last_purchased
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.customer_id = ? AND s.business_id = ? AND s.status = 'completed'
      GROUP BY si.product_id, si.product_name
      ORDER BY purchase_count DESC, total_spent DESC
      LIMIT 5`,
      [customerId, businessId],
    );

    // Get purchase analytics
    const [analytics] = await pool.execute<any[]>(
      `SELECT 
        YEAR(s.sale_date) as year,
        MONTH(s.sale_date) as month,
        COUNT(*) as purchase_count,
        SUM(s.total_amount) as total_spent
      FROM sales s
      WHERE s.customer_id = ? AND s.business_id = ? AND s.status = 'completed'
      GROUP BY YEAR(s.sale_date), MONTH(s.sale_date)
      ORDER BY year DESC, month DESC
      LIMIT 12`,
      [customerId, businessId],
    );

    res.json({
      success: true,
      data: {
        customer,
        recentPurchases,
        favoriteProducts,
        monthlyAnalytics: analytics,
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Create new customer
router.post(
  '/',
  authenticateToken,
  requirePermission('create_customer'),
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

      const {
        name,
        phone,
        email,
        address,
        customerType = 'regular',
      } = req.body;

      // Basic validation
      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Customer name is required',
        });
        return;
      }

      // Validate customer type
      const validTypes = ['regular', 'vip', 'wholesale'];
      if (!validTypes.includes(customerType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid customer type. Must be: regular, vip, or wholesale',
        });
        return;
      }

      // Check if customer with same phone already exists
      if (phone) {
        const [existingCustomers] = await pool.execute<any[]>(
          'SELECT id FROM customers WHERE phone = ? AND business_id = ? AND is_active = TRUE',
          [phone, businessId],
        );

        if (existingCustomers.length > 0) {
          res.status(409).json({
            success: false,
            message: 'Customer with this phone number already exists',
          });
          return;
        }
      }

      // Create customer
      const [customerResult] = await pool.execute<any>(
        `INSERT INTO customers 
      (business_id, name, phone, email, address, customer_type) 
      VALUES (?, ?, ?, ?, ?, ?)`,
        [
          businessId,
          name,
          phone || null,
          email || null,
          address || null,
          customerType,
        ],
      );

      const customerId = customerResult.insertId;

      // Get created customer
      const [createdCustomer] = await pool.execute<any[]>(
        'SELECT * FROM customers WHERE id = ?',
        [customerId],
      );

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: {
          customer: createdCustomer[0],
        },
      });
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create customer',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Update customer
router.put(
  '/:id',
  authenticateToken,
  requirePermission('edit_customer'),
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
      const customerIdParam = req.params.id;

      if (!customerIdParam) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required',
        });
        return;
      }

      const customerId = parseInt(customerIdParam);

      if (isNaN(customerId)) {
        res.status(400).json({
          success: false,
          message: 'Valid customer ID is required',
        });
        return;
      }

      // Check if customer exists
      const [existingCustomers] = await pool.execute<any[]>(
        'SELECT * FROM customers WHERE id = ? AND business_id = ? AND is_active = TRUE',
        [customerId, businessId],
      );

      if (existingCustomers.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
        return;
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];

      Object.keys(req.body).forEach(key => {
        const value = req.body[key];

        switch (key) {
          case 'name':
            if (value) {
              updates.push('name = ?');
              values.push(value);
            }
            break;
          case 'phone':
            updates.push('phone = ?');
            values.push(value);
            break;
          case 'email':
            updates.push('email = ?');
            values.push(value);
            break;
          case 'address':
            updates.push('address = ?');
            values.push(value);
            break;
          case 'customerType':
            const validTypes = ['regular', 'vip', 'wholesale'];
            if (validTypes.includes(value)) {
              updates.push('customer_type = ?');
              values.push(value);
            }
            break;
          // notes field removed
        }
      });

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid fields to update',
        });
        return;
      }

      // Check for phone number conflicts
      if (req.body.phone && req.body.phone !== existingCustomers[0].phone) {
        const [phoneConflicts] = await pool.execute<any[]>(
          'SELECT id FROM customers WHERE phone = ? AND business_id = ? AND id != ? AND is_active = TRUE',
          [req.body.phone, businessId, customerId],
        );

        if (phoneConflicts.length > 0) {
          res.status(409).json({
            success: false,
            message: 'Another customer with this phone number already exists',
          });
          return;
        }
      }

      // Update customer
      values.push(customerId, businessId);

      await pool.execute(
        `UPDATE customers 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND business_id = ?`,
        values,
      );

      res.json({
        success: true,
        message: 'Customer updated successfully',
      });
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customer',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Delete customer (soft delete)
router.delete(
  '/:id',
  authenticateToken,
  requirePermission('delete_customer'),
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
      const customerIdParam = req.params.id;

      if (!customerIdParam) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required',
        });
        return;
      }

      const customerId = parseInt(customerIdParam);

      if (isNaN(customerId)) {
        res.status(400).json({
          success: false,
          message: 'Valid customer ID is required',
        });
        return;
      }

      // Check if customer exists
      const [customers] = await pool.execute<any[]>(
        'SELECT id, name FROM customers WHERE id = ? AND business_id = ? AND is_active = TRUE',
        [customerId, businessId],
      );

      if (customers.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
        return;
      }

      // Check if customer has sales history
      const [salesCount] = await pool.execute<any[]>(
        'SELECT COUNT(*) as count FROM sales WHERE customer_id = ? AND business_id = ?',
        [customerId, businessId],
      );

      if (salesCount[0].count > 0) {
        // Don't actually delete if they have purchase history, just deactivate
        await pool.execute(
          'UPDATE customers SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND business_id = ?',
          [customerId, businessId],
        );

        res.json({
          success: true,
          message:
            'Customer deactivated successfully (purchase history preserved)',
        });
      } else {
        // No purchase history, safe to delete
        await pool.execute(
          'DELETE FROM customers WHERE id = ? AND business_id = ?',
          [customerId, businessId],
        );

        res.json({
          success: true,
          message: 'Customer deleted successfully',
        });
      }
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete customer',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Search customers
router.get(
  '/search/:query',
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
      const query = req.params.query;

      if (!query || query.length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
        });
        return;
      }

      const searchTerm = `%${query}%`;

      const [customers] = await pool.execute<any[]>(
        `SELECT 
        c.id, c.name, c.phone, c.email, c.customer_type,
        c.total_purchases, c.total_orders, c.last_purchase_date
      FROM customers c
      WHERE c.business_id = ? AND c.is_active = TRUE
      AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)
      ORDER BY c.total_purchases DESC, c.name
      LIMIT 20`,
        [businessId, searchTerm, searchTerm, searchTerm],
      );

      res.json({
        success: true,
        data: {
          customers,
          count: customers.length,
        },
      });
    } catch (error) {
      console.error('Search customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search customers',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get customer loyalty/analytics
router.get(
  '/:id/loyalty',
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
      const customerIdParam = req.params.id;

      if (!customerIdParam) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required',
        });
        return;
      }

      const customerId = parseInt(customerIdParam);

      if (isNaN(customerId)) {
        res.status(400).json({
          success: false,
          message: 'Valid customer ID is required',
        });
        return;
      }

      // Get customer loyalty metrics
      const [loyaltyData] = await pool.execute<any[]>(
        `SELECT 
        c.name, c.customer_type, c.total_purchases, c.total_orders,
        c.last_purchase_date, c.created_at,
        DATEDIFF(NOW(), c.created_at) as days_as_customer,
        DATEDIFF(NOW(), c.last_purchase_date) as days_since_last_purchase,
        CASE 
          WHEN c.total_purchases = 0 THEN 0
          ELSE ROUND(c.total_purchases / NULLIF(DATEDIFF(NOW(), c.created_at), 0), 2)
        END as avg_spending_per_day,
        CASE 
          WHEN c.total_orders = 0 THEN 0
          ELSE ROUND(c.total_purchases / c.total_orders, 2)
        END as avg_order_value
      FROM customers c
      WHERE c.id = ? AND c.business_id = ? AND c.is_active = TRUE`,
        [customerId, businessId],
      );

      if (loyaltyData.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
        return;
      }

      // Get purchase frequency analysis
      const [frequencyData] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_visits,
        MIN(s.sale_date) as first_purchase,
        MAX(s.sale_date) as last_purchase,
        AVG(DATEDIFF(s.sale_date, LAG(s.sale_date) OVER (ORDER BY s.sale_date))) as avg_days_between_visits
      FROM sales s
      WHERE s.customer_id = ? AND s.business_id = ? AND s.status = 'completed'`,
        [customerId, businessId],
      );

      // Calculate loyalty score (0-100)
      const customer = loyaltyData[0];
      let loyaltyScore = 0;

      // Factors for loyalty score
      if (customer.total_orders > 10) loyaltyScore += 20; // Frequent buyer
      if (customer.total_purchases > 100000) loyaltyScore += 20; // High value
      if (customer.days_since_last_purchase < 30) loyaltyScore += 20; // Recent activity
      if (customer.days_as_customer > 90) loyaltyScore += 20; // Long-term customer
      if (customer.avg_order_value > 20000) loyaltyScore += 20; // High order value

      // Determine customer tier
      let tier = 'Bronze';
      if (loyaltyScore >= 80) tier = 'Platinum';
      else if (loyaltyScore >= 60) tier = 'Gold';
      else if (loyaltyScore >= 40) tier = 'Silver';

      res.json({
        success: true,
        data: {
          customer: customer,
          frequency: frequencyData[0],
          loyalty: {
            score: loyaltyScore,
            tier,
            benefits: getLoyaltyBenefits(tier),
          },
          recommendations: getCustomerRecommendations(customer),
        },
      });
    } catch (error) {
      console.error('Customer loyalty error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer loyalty data',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get customer analytics dashboard
router.get(
  '/analytics/dashboard',
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
      const days = parseInt(req.query.days as string) || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get customer overview stats
      const [overview] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN c.customer_type = 'vip' THEN 1 END) as vip_customers,
        COUNT(CASE WHEN c.customer_type = 'wholesale' THEN 1 END) as wholesale_customers,
        COUNT(CASE WHEN c.last_purchase_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as active_customers,
        COUNT(CASE WHEN c.created_at >= ? THEN 1 END) as new_customers,
        AVG(c.total_purchases) as avg_customer_value,
        SUM(c.total_purchases) as total_customer_value
      FROM customers c
      WHERE c.business_id = ? AND c.is_active = TRUE`,
        [startDate.toISOString(), businessId],
      );

      // Get top customers by value
      const [topCustomers] = await pool.execute<any[]>(
        `SELECT 
        c.id, c.name, c.phone, c.customer_type,
        c.total_purchases, c.total_orders, c.last_purchase_date
      FROM customers c
      WHERE c.business_id = ? AND c.is_active = TRUE
      ORDER BY c.total_purchases DESC
      LIMIT 10`,
        [businessId],
      );

      // Get customer acquisition trend
      const [acquisitionTrend] = await pool.execute<any[]>(
        `SELECT 
        DATE(c.created_at) as date,
        COUNT(*) as new_customers
      FROM customers c
      WHERE c.business_id = ? AND c.created_at >= ?
      GROUP BY DATE(c.created_at)
      ORDER BY date`,
        [businessId, startDate.toISOString()],
      );

      // Get customer segments
      const [segments] = await pool.execute<any[]>(
        `SELECT 
        CASE 
          WHEN c.total_purchases = 0 THEN 'new'
          WHEN c.total_purchases > 500000 THEN 'high_value'
          WHEN c.total_orders > 10 THEN 'frequent'
          WHEN c.last_purchase_date < DATE_SUB(NOW(), INTERVAL 60 DAY) THEN 'inactive'
          ELSE 'regular'
        END as segment,
        COUNT(*) as customer_count,
        SUM(c.total_purchases) as segment_value
      FROM customers c
      WHERE c.business_id = ? AND c.is_active = TRUE
      GROUP BY segment`,
        [businessId],
      );

      res.json({
        success: true,
        data: {
          period: `${days} days`,
          overview: overview[0],
          topCustomers,
          acquisitionTrend,
          segments,
        },
      });
    } catch (error) {
      console.error('Customer analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer analytics',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Helper functions
function getLoyaltyBenefits(tier: string) {
  const benefits = {
    Bronze: ['Points on purchases', 'Birthday discount'],
    Silver: ['5% discount', 'Priority support', 'Early access to sales'],
    Gold: ['10% discount', 'Free delivery', 'Exclusive products'],
    Platinum: [
      '15% discount',
      'Personal shopper',
      'VIP events',
      'Custom orders',
    ],
  };
  return benefits[tier as keyof typeof benefits] || benefits.Bronze;
}

function getCustomerRecommendations(customer: any) {
  const recommendations = [];

  if (customer.days_since_last_purchase > 30) {
    recommendations.push('Send re-engagement SMS or call');
  }

  if (customer.avg_order_value > 50000) {
    recommendations.push('Offer premium products or services');
  }

  if (customer.total_orders > 15 && customer.customer_type === 'regular') {
    recommendations.push('Consider upgrading to VIP status');
  }

  if (customer.days_as_customer > 365) {
    recommendations.push('Send anniversary appreciation message');
  }

  return recommendations;
}

// Test endpoint
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Customer routes are working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
