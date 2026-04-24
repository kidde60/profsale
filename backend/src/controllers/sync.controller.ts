// controllers/sync.controller.ts - Synchronization controller for offline-first architecture
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { pool } from '../config/database';
import { withTransaction } from '../utils/transaction';

export interface SyncData {
  deviceId: string;
  lastSyncTimestamp: string;
  changes: {
    sales?: any[];
    products?: any[];
    customers?: any[];
    expenses?: any[];
  };
}

/**
 * Sync client data with server
 */
export async function syncData(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const syncRequestData: SyncData = req.body;
    const userId = (req as any).user.id;
    const businessId = (req as any).user.businessId;

    logger.info('Sync request received', {
      deviceId: syncRequestData.deviceId,
      userId,
      businessId,
      changesCount: Object.keys(syncRequestData.changes).length,
    });

    // Validate sync data
    if (!syncRequestData.deviceId || !syncRequestData.changes) {
      res.status(400).json({
        success: false,
        message: 'Invalid sync data',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Process changes in transaction
    const syncResults = await withTransaction(async (connection) => {
      const results: any = {
        synced: { sales: 0, products: 0, customers: 0, expenses: 0 },
        conflicts: [],
      };

      // Sync sales
      if (syncRequestData.changes.sales && syncRequestData.changes.sales.length > 0) {
        for (const sale of syncRequestData.changes.sales) {
          try {
            // Check if sale already exists
            const [existing] = await connection.execute(
              'SELECT id FROM sales WHERE sale_number = ? AND business_id = ?',
              [sale.saleNumber, businessId],
            );

            if ((existing as any[]).length === 0) {
              // Insert new sale
              await connection.execute(
                `INSERT INTO sales (
                  business_id, customer_id, customer_name, customer_phone,
                  sale_number, subtotal, total_amount, discount_amount, tax_amount,
                  payment_method, payment_status, status, notes, created_by, synced
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                  businessId,
                  sale.customerId || null,
                  sale.customerName,
                  sale.customerPhone,
                  sale.saleNumber,
                  sale.subtotal,
                  sale.totalAmount,
                  sale.discountAmount,
                  sale.taxAmount,
                  sale.paymentMethod,
                  sale.paymentStatus,
                  sale.status || 'completed',
                  sale.notes || null,
                  userId,
                ],
              );

              const [saleResult] = await connection.execute(
                'SELECT LAST_INSERT_ID() as id',
              );
              const saleId = (saleResult as any)[0].id;

              // Insert sale items
              for (const item of sale.items) {
                await connection.execute(
                  `INSERT INTO sale_items (
                    sale_id, product_id, quantity, unit_price, discount, subtotal
                  ) VALUES (?, ?, ?, ?, ?, ?)`,
                  [saleId, item.productId, item.quantity, item.unitPrice, item.discount, item.subtotal],
                );
              }

              results.synced.sales++;
            } else {
              // Conflict: sale already exists
              results.conflicts.push({
                type: 'sale',
                id: sale.saleNumber,
                message: 'Sale with this number already exists',
              });
            }
          } catch (error) {
            logger.error('Error syncing sale', { error, sale });
            results.conflicts.push({
              type: 'sale',
              id: sale.saleNumber,
              message: 'Failed to sync sale',
            });
          }
        }
      }

      // Sync products
      if (syncRequestData.changes.products && syncRequestData.changes.products.length > 0) {
        for (const product of syncRequestData.changes.products) {
          try {
            // Check if product exists by barcode or ID
            const [existing] = await connection.execute(
              'SELECT id FROM products WHERE (id = ? OR barcode = ?) AND business_id = ?',
              [product.id, product.barcode, businessId],
            );

            if ((existing as any[]).length === 0) {
              // Insert new product
              await connection.execute(
                `INSERT INTO products (
                  business_id, name, category, sku, barcode,
                  buying_price, selling_price, current_stock, min_stock_level,
                  unit, is_active, synced
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
                [
                  businessId,
                  product.name,
                  product.category || null,
                  product.sku || null,
                  product.barcode || null,
                  product.buyingPrice,
                  product.sellingPrice,
                  product.currentStock,
                  product.minStockLevel,
                  product.unit || 'piece',
                ],
              );
              results.synced.products++;
            } else {
              // Update existing product
              await connection.execute(
                `UPDATE products SET
                  name = ?, category = ?, sku = ?, barcode = ?,
                  buying_price = ?, selling_price = ?, current_stock = ?,
                  min_stock_level = ?, unit = ?, synced = 1,
                  updated_at = NOW()
                WHERE id = ? AND business_id = ?`,
                [
                  product.name,
                  product.category || null,
                  product.sku || null,
                  product.barcode || null,
                  product.buyingPrice,
                  product.sellingPrice,
                  product.currentStock,
                  product.minStockLevel,
                  product.unit || 'piece',
                  (existing as any[])[0].id,
                  businessId,
                ],
              );
              results.synced.products++;
            }
          } catch (error) {
            logger.error('Error syncing product', { error, product });
            results.conflicts.push({
              type: 'product',
              id: product.id,
              message: 'Failed to sync product',
            });
          }
        }
      }

      // Sync customers
      if (syncRequestData.changes.customers && syncRequestData.changes.customers.length > 0) {
        for (const customer of syncRequestData.changes.customers) {
          try {
            const [existing] = await connection.execute(
              'SELECT id FROM customers WHERE (id = ? OR phone = ?) AND business_id = ?',
              [customer.id, customer.phone, businessId],
            );

            if ((existing as any[]).length === 0) {
              await connection.execute(
                `INSERT INTO customers (
                  business_id, name, phone, email, address,
                  customer_type, notes, synced
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                  businessId,
                  customer.name,
                  customer.phone || null,
                  customer.email || null,
                  customer.address || null,
                  customer.customerType || 'regular',
                  customer.notes || null,
                ],
              );
              results.synced.customers++;
            } else {
              await connection.execute(
                `UPDATE customers SET
                  name = ?, phone = ?, email = ?, address = ?,
                  customer_type = ?, notes = ?, synced = 1,
                  updated_at = NOW()
                WHERE id = ? AND business_id = ?`,
                [
                  customer.name,
                  customer.phone || null,
                  customer.email || null,
                  customer.address || null,
                  customer.customerType || 'regular',
                  customer.notes || null,
                  (existing as any[])[0].id,
                  businessId,
                ],
              );
              results.synced.customers++;
            }
          } catch (error) {
            logger.error('Error syncing customer', { error, customer });
            results.conflicts.push({
              type: 'customer',
              id: customer.id,
              message: 'Failed to sync customer',
            });
          }
        }
      }

      // Sync expenses
      if (syncRequestData.changes.expenses && syncRequestData.changes.expenses.length > 0) {
        for (const expense of syncRequestData.changes.expenses) {
          try {
            await connection.execute(
              `INSERT INTO expenses (
                business_id, category, description, amount,
                expense_date, created_by, synced
              ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
              [
                businessId,
                expense.category,
                expense.description,
                expense.amount,
                expense.expenseDate,
                userId,
              ],
            );
            results.synced.expenses++;
          } catch (error) {
            logger.error('Error syncing expense', { error, expense });
            results.conflicts.push({
              type: 'expense',
              id: expense.id,
              message: 'Failed to sync expense',
            });
          }
        }
      }

      // Update device sync timestamp
      await connection.execute(
        `INSERT INTO sync_devices (device_id, business_id, user_id, last_sync)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE last_sync = NOW()`,
        [syncRequestData.deviceId, businessId, userId],
      );

      return results;
    });

    // Fetch server changes since last sync
    const serverChanges = await fetchServerChanges(businessId, syncRequestData.lastSyncTimestamp);

    logger.info('Sync completed', {
      deviceId: syncRequestData.deviceId,
      synced: syncResults.synced,
      conflicts: syncResults.conflicts.length,
      serverChangesCount: Object.keys(serverChanges).length,
    });

    res.json({
      success: true,
      data: {
        syncResults,
        serverChanges,
        syncTimestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Sync failed', { error });
    next(error);
  }
}

/**
 * Fetch server changes since last sync
 */
async function fetchServerChanges(businessId: number, lastSyncTimestamp: string) {
  const changes: any = {
    sales: [],
    products: [],
    customers: [],
    expenses: [],
  };

  try {
    // Fetch new sales
    const [sales] = await pool.execute(
      `SELECT * FROM sales 
       WHERE business_id = ? AND created_at > ? AND synced = 1
       ORDER BY created_at ASC`,
      [businessId, lastSyncTimestamp],
    );
    changes.sales = sales;

    // Fetch updated products
    const [products] = await pool.execute(
      `SELECT * FROM products 
       WHERE business_id = ? AND updated_at > ? AND synced = 1
       ORDER BY updated_at ASC`,
      [businessId, lastSyncTimestamp],
    );
    changes.products = products;

    // Fetch updated customers
    const [customers] = await pool.execute(
      `SELECT * FROM customers 
       WHERE business_id = ? AND updated_at > ? AND synced = 1
       ORDER BY updated_at ASC`,
      [businessId, lastSyncTimestamp],
    );
    changes.customers = customers;

    // Fetch new expenses
    const [expenses] = await pool.execute(
      `SELECT * FROM expenses 
       WHERE business_id = ? AND created_at > ? AND synced = 1
       ORDER BY created_at ASC`,
      [businessId, lastSyncTimestamp],
    );
    changes.expenses = expenses;
  } catch (error) {
    logger.error('Error fetching server changes', { error });
  }

  return changes;
}

/**
 * Get sync status for a device
 */
export async function getSyncStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deviceId = req.query.deviceId as string;
    const businessId = (req as any).user.businessId;

    if (!deviceId) {
      res.status(400).json({
        success: false,
        message: 'Device ID is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const [devices] = await pool.execute(
      `SELECT * FROM sync_devices 
       WHERE device_id = ? AND business_id = ?`,
      [deviceId, businessId],
    );

    const status = (devices as any[]).length > 0 ? (devices as any[])[0] : null;

    res.json({
      success: true,
      data: {
        deviceId,
        lastSync: status?.last_sync || null,
        isRegistered: !!status,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting sync status', { error });
    next(error);
  }
}

/**
 * Resolve sync conflicts
 */
export async function resolveConflict(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { conflictId, resolution, data } = req.body;
    const userId = (req as any).user.id;
    const businessId = (req as any).user.businessId;

    // Log conflict resolution
    await pool.execute(
      `INSERT INTO sync_conflicts (conflict_id, business_id, user_id, resolution, data, resolved_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [conflictId, businessId, userId, resolution, JSON.stringify(data)],
    );

    logger.info('Conflict resolved', {
      conflictId,
      resolution,
      userId,
      businessId,
    });

    res.json({
      success: true,
      message: 'Conflict resolved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error resolving conflict', { error });
    next(error);
  }
}
