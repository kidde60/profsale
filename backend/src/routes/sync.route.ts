import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../config/database';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken as any);

// Get sync timestamp for client
router.get('/timestamp', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Sync timestamp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync timestamp',
    });
  }
});

// Sync products - pull changes from server
router.get('/products', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const lastSync = req.query.last_sync as string;

    let query = `
      SELECT id, business_id, category_id, name, description, barcode,
             buying_price, selling_price, current_stock, min_stock_level,
             unit, product_image, created_by, is_active,
             created_at, updated_at
      FROM products 
      WHERE business_id = ? AND is_active = TRUE
    `;
    const params: any[] = [businessId];

    if (lastSync && lastSync !== '0') {
      query += ' AND updated_at > ?';
      params.push(new Date(parseInt(lastSync)));
    }

    query += ' ORDER BY updated_at ASC';

    const [products] = await pool.execute<any[]>(query, params);

    res.json({
      success: true,
      products: products.map(product => ({
        ...product,
        updated_at: new Date(product.updated_at).getTime(),
        created_at: new Date(product.created_at).getTime(),
      })),
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Sync products pull error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync products',
    });
  }
});

// Sync products - push changes to server
router.post('/products', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const userId = (req as any).user.id;
    const { products } = req.body;

    if (!Array.isArray(products)) {
      res.status(400).json({
        success: false,
        message: 'Products must be an array',
      });
      return;
    }

    const results = [];

    for (const product of products) {
      try {
        if (product.server_id && product.server_id !== 'null') {
          // Update existing product
          const [updateResult] = await pool.execute<any>(
            `UPDATE products SET 
               name = ?, description = ?, barcode = ?,
               buying_price = ?, selling_price = ?, current_stock = ?,
               min_stock_level = ?, unit = ?, product_image = ?,
               updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND business_id = ?`,
            [
              product.name,
              product.description || '',
              product.barcode || '',
              product.buying_price || 0,
              product.selling_price,
              product.current_stock || 0,
              product.min_stock_level || 0,
              product.unit || '',
              product.product_image || '',
              product.server_id,
              businessId,
            ],
          );

          results.push({
            localId: product.local_id,
            serverId: product.server_id,
            action: 'updated',
            success: true,
          });
        } else {
          // Create new product
          const [insertResult] = await pool.execute<any>(
            `INSERT INTO products 
               (business_id, category_id, name, description, barcode,
                buying_price, selling_price, current_stock, min_stock_level,
                unit, product_image, created_by, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
              businessId,
              product.category_id || null,
              product.name,
              product.description || '',
              product.barcode || '',
              product.buying_price || 0,
              product.selling_price,
              product.current_stock || 0,
              product.min_stock_level || 0,
              product.unit || '',
              product.product_image || '',
              userId,
            ],
          );

          results.push({
            localId: product.local_id,
            serverId: insertResult.insertId,
            action: 'created',
            success: true,
          });
        }
      } catch (error) {
        console.error(`Failed to sync product ${product.local_id}:`, error);
        results.push({
          localId: product.local_id,
          serverId: product.server_id,
          action: 'error',
          success: false,
          error: (error as Error).message,
        });
      }
    }

    res.json({
      success: true,
      results,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Sync products push error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to push products',
    });
  }
});

// Sync sales - pull changes from server
router.get('/sales', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const lastSync = req.query.last_sync as string;

    let query = `
      SELECT s.id, s.business_id, s.employee_id, s.customer_id,
             s.sale_number, s.customer_name, s.customer_phone,
             s.subtotal, s.tax_amount, s.discount_amount, s.total_amount,
             s.amount_paid, s.change_amount, s.payment_method,
             s.payment_reference, s.status, s.notes, s.sale_date,
             s.created_at, s.updated_at
      FROM sales s
      WHERE s.business_id = ?
    `;
    const params: any[] = [businessId];

    if (lastSync && lastSync !== '0') {
      query += ' AND s.updated_at > ?';
      params.push(new Date(parseInt(lastSync)));
    }

    query += ' ORDER BY s.updated_at ASC';

    const [sales] = await pool.execute<any[]>(query, params);

    // Get sale items for each sale
    const salesWithItems = await Promise.all(
      sales.map(async sale => {
        const [items] = await pool.execute<any[]>(
          `SELECT id, sale_id, product_id, product_name, product_barcode,
                  quantity, unit_price, total_price, cost_price
           FROM sale_items WHERE sale_id = ?`,
          [sale.id],
        );

        return {
          ...sale,
          items,
          sale_date: new Date(sale.sale_date).getTime(),
          updated_at: new Date(sale.updated_at).getTime(),
          created_at: new Date(sale.created_at).getTime(),
        };
      }),
    );

    res.json({
      success: true,
      sales: salesWithItems,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Sync sales pull error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync sales',
    });
  }
});

// Sync sales - push changes to server
router.post('/sales', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const userId = (req as any).user.id;
    const { sales } = req.body;

    if (!Array.isArray(sales)) {
      res.status(400).json({
        success: false,
        message: 'Sales must be an array',
      });
      return;
    }

    const results = [];

    for (const sale of sales) {
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        let saleId = sale.server_id;

        if (saleId && saleId !== 'null') {
          // Update existing sale
          await connection.execute(
            `UPDATE sales SET 
               customer_id = ?, customer_name = ?, customer_phone = ?,
               subtotal = ?, tax_amount = ?, discount_amount = ?, total_amount = ?,
               amount_paid = ?, change_amount = ?, payment_method = ?,
               payment_reference = ?, status = ?, notes = ?,
               updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND business_id = ?`,
            [
              sale.customer_id || null,
              sale.customer_name || '',
              sale.customer_phone || '',
              sale.subtotal,
              sale.tax_amount || 0,
              sale.discount_amount || 0,
              sale.total_amount,
              sale.amount_paid,
              sale.change_amount || 0,
              sale.payment_method || 'cash',
              sale.payment_reference || '',
              sale.status || 'completed',
              sale.notes || '',
              saleId,
              businessId,
            ],
          );
        } else {
          // Create new sale
          const [insertResult] = await connection.execute<any>(
            `INSERT INTO sales 
               (business_id, employee_id, customer_id, sale_number,
                customer_name, customer_phone, subtotal, tax_amount,
                discount_amount, total_amount, amount_paid, change_amount,
                payment_method, payment_reference, status, notes, sale_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              businessId,
              userId,
              sale.customer_id || null,
              sale.sale_number,
              sale.customer_name || '',
              sale.customer_phone || '',
              sale.subtotal,
              sale.tax_amount || 0,
              sale.discount_amount || 0,
              sale.total_amount,
              sale.amount_paid,
              sale.change_amount || 0,
              sale.payment_method || 'cash',
              sale.payment_reference || '',
              sale.status || 'completed',
              sale.notes || '',
              new Date(sale.sale_date),
            ],
          );

          saleId = insertResult.insertId;
        }

        // Handle sale items
        if (sale.items && Array.isArray(sale.items)) {
          // Delete existing items if updating
          if (sale.server_id && sale.server_id !== 'null') {
            await connection.execute(
              'DELETE FROM sale_items WHERE sale_id = ?',
              [saleId],
            );
          }

          // Insert new items
          for (const item of sale.items) {
            await connection.execute(
              `INSERT INTO sale_items 
                 (sale_id, product_id, product_name, product_barcode,
                  quantity, unit_price, total_price, cost_price)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                saleId,
                item.product_id,
                item.product_name,
                item.product_barcode || '',
                item.quantity,
                item.unit_price,
                item.total_price,
                item.cost_price || 0,
              ],
            );
          }
        }

        await connection.commit();

        results.push({
          localId: sale.local_id,
          serverId: saleId,
          action: sale.server_id ? 'updated' : 'created',
          success: true,
        });
      } catch (error) {
        await connection.rollback();
        console.error(`Failed to sync sale ${sale.local_id}:`, error);
        results.push({
          localId: sale.local_id,
          serverId: sale.server_id,
          action: 'error',
          success: false,
          error: (error as Error).message,
        });
      } finally {
        connection.release();
      }
    }

    res.json({
      success: true,
      results,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error('Sync sales push error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to push sales',
    });
  }
});

// Full sync endpoint - gets all data types
router.post('/full', async (req: Request, res: Response) => {
  try {
    const businessId = (req as any).user.businessId;
    const { lastSync = '0' } = req.body;

    const syncTime = Date.now();

    // Get products
    const [products] = await pool.execute<any[]>(
      `SELECT id, business_id, category_id, name, description, barcode,
              buying_price, selling_price, current_stock, min_stock_level,
              unit, product_image, created_by, is_active,
              created_at, updated_at
       FROM products 
       WHERE business_id = ? AND is_active = TRUE AND updated_at > ?
       ORDER BY updated_at ASC`,
      [businessId, new Date(parseInt(lastSync))],
    );

    // Get sales with items
    const [sales] = await pool.execute<any[]>(
      `SELECT id, business_id, employee_id, customer_id, sale_number,
              customer_name, customer_phone, subtotal, tax_amount,
              discount_amount, total_amount, amount_paid, change_amount,
              payment_method, payment_reference, status, notes, sale_date,
              created_at, updated_at
       FROM sales 
       WHERE business_id = ? AND updated_at > ?
       ORDER BY updated_at ASC`,
      [businessId, new Date(parseInt(lastSync))],
    );

    const salesWithItems = await Promise.all(
      sales.map(async sale => {
        const [items] = await pool.execute<any[]>(
          `SELECT id, sale_id, product_id, product_name, product_barcode,
                  quantity, unit_price, total_price, cost_price
           FROM sale_items WHERE sale_id = ?`,
          [sale.id],
        );

        return {
          ...sale,
          items,
          sale_date: new Date(sale.sale_date).getTime(),
          updated_at: new Date(sale.updated_at).getTime(),
          created_at: new Date(sale.created_at).getTime(),
        };
      }),
    );

    res.json({
      success: true,
      data: {
        products: products.map(product => ({
          ...product,
          updated_at: new Date(product.updated_at).getTime(),
          created_at: new Date(product.created_at).getTime(),
        })),
        sales: salesWithItems,
      },
      syncTime,
      serverTime: syncTime,
    });
  } catch (error) {
    console.error('Full sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform full sync',
    });
  }
});

export default router;
