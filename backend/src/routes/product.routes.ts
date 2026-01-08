// routes/products.routes.ts - TypeScript fixed version
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Get all products with filtering and pagination
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    // Filters
    const search = req.query.search as string;
    const categoryId = req.query.category_id as string;
    const stockStatus = req.query.stock_status as string;

    // Build WHERE clause
    let whereClause = 'WHERE p.business_id = ? AND p.is_active = TRUE';
    let queryParams: any[] = [businessId];

    if (search) {
      whereClause +=
        ' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (categoryId) {
      whereClause += ' AND p.category_id = ?';
      queryParams.push(parseInt(categoryId));
    }

    if (stockStatus) {
      switch (stockStatus) {
        case 'low':
          whereClause +=
            ' AND p.current_stock <= p.min_stock_level AND p.current_stock > 0';
          break;
        case 'out':
          whereClause += ' AND p.current_stock = 0';
          break;
        case 'normal':
          whereClause += ' AND p.current_stock > p.min_stock_level';
          break;
      }
    }

    // Get total count
    const [countResult] = await pool.execute<any[]>(
      `SELECT COUNT(*) as total 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ${whereClause}`,
      queryParams,
    );

    const total = countResult[0].total;

    // Get products
    const [products] = await pool.execute<any[]>(
      `SELECT 
        p.id, p.name, p.description, p.barcode, p.buying_price, p.selling_price,
        p.current_stock, p.min_stock_level, p.unit, p.product_image,
        p.created_at, p.updated_at,
        c.name as category_name,
        CASE 
          WHEN p.current_stock = 0 THEN 'out'
          WHEN p.current_stock <= p.min_stock_level THEN 'low'
          ELSE 'normal'
        END as stock_status,
        ROUND(((p.selling_price - p.buying_price) / p.buying_price) * 100, 2) as profit_margin
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.name ASC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    // Get summary statistics
    const [summary] = await pool.execute<any[]>(
      `SELECT 
        COUNT(CASE WHEN p.current_stock <= p.min_stock_level AND p.current_stock > 0 THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN p.current_stock = 0 THEN 1 END) as out_of_stock_count,
        SUM(p.current_stock * p.buying_price) as total_inventory_value
      FROM products p
      WHERE p.business_id = ? AND p.is_active = TRUE`,
      [businessId],
    );

    res.json({
      success: true,
      data: {
        products,
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
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Get single product by ID
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const productIdParam = req.params.id;

    if (!productIdParam) {
      res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
      return;
    }

    const productId = parseInt(productIdParam);

    if (isNaN(productId)) {
      res.status(400).json({
        success: false,
        message: 'Valid product ID is required',
      });
      return;
    }

    const [products] = await pool.execute<any[]>(
      `SELECT 
        p.*, c.name as category_name,
        CASE 
          WHEN p.current_stock = 0 THEN 'out'
          WHEN p.current_stock <= p.min_stock_level THEN 'low'
          ELSE 'normal'
        END as stock_status,
        ROUND(((p.selling_price - p.buying_price) / p.buying_price) * 100, 2) as profit_margin
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.business_id = ? AND p.is_active = TRUE`,
      [productId, businessId],
    );

    if (products.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        product: products[0],
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Create new product
router.post(
  '/',
  authenticateToken,
  requirePermission('create_product'),
  async (req: Request, res: Response) => {
    try {
      const businessId = req.user?.businessId;
      const userId = req.user?.id;

      // Enhanced debugging
      console.log('=== CREATE PRODUCT ENDPOINT ===');
      console.log('Headers:', req.headers);
      console.log('Content-Type:', req.headers['content-type']);
      console.log('Body (raw):', req.body);
      console.log('Body type:', typeof req.body);
      console.log('Body keys:', req.body ? Object.keys(req.body) : 'No body');
      console.log('Body JSON:', JSON.stringify(req.body));
      console.log('Business ID:', businessId);
      console.log('User ID:', userId);

      const {
        name,
        description,
        barcode,
        buyingPrice,
        buying_price, // Accept both camelCase and snake_case
        sellingPrice,
        selling_price, // Accept both camelCase and snake_case
        currentStock,
        current_stock, // Accept both camelCase and snake_case
        minStockLevel,
        min_stock_level, // Accept both camelCase and snake_case
        categoryId,
        category_id, // Accept both camelCase and snake_case
        unit,
      } = req.body;

      // Normalize field names (use snake_case if camelCase is not provided)
      const normalizedBuyingPrice = buyingPrice || buying_price;
      const normalizedSellingPrice = sellingPrice || selling_price;
      const normalizedCurrentStock = currentStock || current_stock || 0;
      const normalizedMinStockLevel = minStockLevel || min_stock_level || 0;
      const normalizedCategoryId = categoryId || category_id;

      // Basic validation
      if (
        !name ||
        normalizedBuyingPrice == null ||
        normalizedSellingPrice == null
      ) {
        res.status(400).json({
          success: false,
          message: 'Name, buying price, and selling price are required',
        });
        return;
      }

      if (normalizedBuyingPrice < 0 || normalizedSellingPrice < 0) {
        res.status(400).json({
          success: false,
          message: 'Prices cannot be negative',
        });
        return;
      }

      if (normalizedSellingPrice <= normalizedBuyingPrice) {
        res.status(400).json({
          success: false,
          message: 'Selling price must be greater than buying price',
        });
        return;
      }

      // Check if barcode already exists
      if (barcode) {
        const [existingProducts] = await pool.execute<any[]>(
          'SELECT id FROM products WHERE barcode = ? AND business_id = ? AND is_active = TRUE',
          [barcode, businessId],
        );

        if (existingProducts.length > 0) {
          res.status(409).json({
            success: false,
            message: 'Product with this barcode already exists',
          });
          return;
        }
      }

      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Insert product
        const [productResult] = await connection.execute<any>(
          `INSERT INTO products 
        (business_id, category_id, name, description, barcode, buying_price, 
         selling_price, current_stock, min_stock_level, unit, created_by) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            businessId,
            normalizedCategoryId || null,
            name,
            description || null,
            barcode || null,
            normalizedBuyingPrice,
            normalizedSellingPrice,
            normalizedCurrentStock,
            normalizedMinStockLevel || 5,
            unit || 'pieces',
            userId,
          ],
        );

        const productId = productResult.insertId;

        // TODO: Create initial inventory movement if stock > 0 (when inventory_movements table is created)
        // if (normalizedCurrentStock && normalizedCurrentStock > 0) {
        //   await connection.execute(
        //     `INSERT INTO inventory_movements
        //     (business_id, product_id, movement_type, quantity_change,
        //      balance_after, unit_cost, created_by, notes)
        //     VALUES (?, ?, 'initial', ?, ?, ?, ?, ?)`,
        //     [
        //       businessId,
        //       productId,
        //       normalizedCurrentStock,
        //       normalizedCurrentStock,
        //       normalizedBuyingPrice,
        //       userId,
        //       'Initial stock',
        //     ],
        //   );
        // }

        await connection.commit();

        // Get created product with category info
        const [createdProduct] = await pool.execute<any[]>(
          `SELECT 
          p.*, c.name as category_name,
          ROUND(((p.selling_price - p.buying_price) / p.buying_price) * 100, 2) as profit_margin
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?`,
          [productId],
        );

        res.status(201).json({
          success: true,
          message: 'Product created successfully',
          data: {
            product: createdProduct[0],
          },
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Update product
router.put(
  '/:id',
  authenticateToken,
  requirePermission('edit_product'),
  async (req: Request, res: Response) => {
    try {
      const businessId = req.user?.businessId;
      const userId = req.user?.id;
      const productIdParam = req.params.id;

      // Enhanced debugging
      console.log('=== UPDATE PRODUCT ENDPOINT ===');
      console.log('Product ID param:', productIdParam);
      console.log('Headers:', req.headers);
      console.log('Content-Type:', req.headers['content-type']);
      console.log('Body (raw):', req.body);
      console.log('Body type:', typeof req.body);
      console.log('Body keys:', req.body ? Object.keys(req.body) : 'No body');
      console.log('Body JSON:', JSON.stringify(req.body));
      console.log('Business ID:', businessId);
      console.log('User ID:', userId);

      if (!productIdParam) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
        return;
      }

      const productId = parseInt(productIdParam);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          message: 'Valid product ID is required',
        });
        return;
      }

      // Check if product exists
      const [existingProducts] = await pool.execute<any[]>(
        'SELECT * FROM products WHERE id = ? AND business_id = ? AND is_active = TRUE',
        [productId, businessId],
      );

      if (existingProducts.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
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
          case 'description':
            updates.push('description = ?');
            values.push(value);
            break;
          case 'barcode':
            updates.push('barcode = ?');
            values.push(value);
            break;
          case 'buyingPrice':
            if (value >= 0) {
              updates.push('buying_price = ?');
              values.push(value);
            }
            break;
          case 'sellingPrice':
            if (value >= 0) {
              updates.push('selling_price = ?');
              values.push(value);
            }
            break;
          case 'minStockLevel':
            if (value >= 0) {
              updates.push('min_stock_level = ?');
              values.push(value);
            }
            break;
          case 'currentStock':
            if (value >= 0) {
              updates.push('current_stock = ?');
              values.push(value);
            }
            break;
          case 'categoryId':
            updates.push('category_id = ?');
            values.push(value);
            break;
          case 'unit':
            if (value) {
              updates.push('unit = ?');
              values.push(value);
            }
            break;
        }
      });

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No valid fields to update',
        });
        return;
      }

      // Update product
      values.push(productId, businessId);

      await pool.execute(
        `UPDATE products 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND business_id = ?`,
        values,
      );

      res.json({
        success: true,
        message: 'Product updated successfully',
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Delete product (soft delete)
router.delete(
  '/:id',
  authenticateToken,
  requirePermission('delete_product'),
  async (req: Request, res: Response) => {
    try {
      const businessId = req.user?.businessId;
      const productIdParam = req.params.id;

      if (!productIdParam) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
        return;
      }

      const productId = parseInt(productIdParam);

      if (isNaN(productId)) {
        res.status(400).json({
          success: false,
          message: 'Valid product ID is required',
        });
        return;
      }

      // Check if product exists
      const [products] = await pool.execute<any[]>(
        'SELECT id, name FROM products WHERE id = ? AND business_id = ? AND is_active = TRUE',
        [productId, businessId],
      );

      if (products.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Product not found',
        });
        return;
      }

      // Soft delete
      await pool.execute(
        'UPDATE products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND business_id = ?',
        [productId, businessId],
      );

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get categories
router.get(
  '/categories/list',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = req.user?.businessId;

      const [categories] = await pool.execute<any[]>(
        `SELECT 
        c.id, c.name, c.description, c.created_at,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
      WHERE c.business_id = ? AND c.is_active = TRUE
      GROUP BY c.id, c.name, c.description, c.created_at
      ORDER BY c.name`,
        [businessId],
      );

      res.json({
        success: true,
        data: {
          categories,
        },
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Search products by barcode
router.get(
  '/search/barcode/:barcode',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const businessId = req.user?.businessId;
      const barcode = req.params.barcode;

      if (!barcode) {
        res.status(400).json({
          success: false,
          message: 'Barcode is required',
        });
        return;
      }

      const [products] = await pool.execute<any[]>(
        `SELECT 
        p.*, c.name as category_name,
        CASE 
          WHEN p.current_stock = 0 THEN 'out'
          WHEN p.current_stock <= p.min_stock_level THEN 'low'
          ELSE 'normal'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = ? AND p.business_id = ? AND p.is_active = TRUE`,
        [barcode, businessId],
      );

      if (products.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Product with this barcode not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          product: products[0],
        },
      });
    } catch (error) {
      console.error('Barcode search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search product by barcode',
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
    message: 'Products routes are working',
    timestamp: new Date().toISOString(),
  });
});

export default router;
