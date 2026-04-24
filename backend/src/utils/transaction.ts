// utils/transaction.ts - Database transaction wrapper for data consistency
import { pool } from '../config/database';
import logger from './logger';

export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  timeout?: number;
}

/**
 * Execute a callback function within a database transaction
 * Automatically commits on success and rolls back on error
 */
export async function withTransaction<T>(
  callback: (connection: any) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Set isolation level if specified
    if (options.isolationLevel) {
      await connection.query(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`);
    }
    
    logger.debug('Transaction started', {
      isolationLevel: options.isolationLevel,
      threadId: connection.threadId,
    });
    
    const result = await callback(connection);
    
    await connection.commit();
    logger.debug('Transaction committed', { threadId: connection.threadId });
    
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction rolled back', {
      error: error instanceof Error ? error.message : 'Unknown error',
      threadId: connection.threadId,
    });
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Execute multiple queries within a transaction
 * Useful for bulk operations
 */
export async function executeTransactionQueries(
  queries: Array<{ sql: string; params?: any[] }>,
  options: TransactionOptions = {},
): Promise<any[]> {
  return withTransaction(async (connection) => {
    const results = [];
    
    for (const query of queries) {
      const [result] = await connection.execute(query.sql, query.params || []);
      results.push(result);
    }
    
    return results;
  }, options);
}

/**
 * Check if a connection is in a transaction
 */
export function isInTransaction(connection: any): boolean {
  return connection && connection.connection && connection.connection._protocol;
}

/**
 * Transaction helper for sale operations with inventory updates
 */
export async function executeSaleTransaction(
  saleData: any,
  saleItems: any[],
  inventoryUpdates: any[],
): Promise<{ saleId: number; saleNumber: string }> {
  return withTransaction(async (connection) => {
    // Insert sale
    const [saleResult] = await connection.execute(
      `INSERT INTO sales (
        business_id, customer_id, customer_name, customer_phone,
        sale_number, subtotal, total_amount, discount_amount, tax_amount,
        payment_method, payment_status, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saleData.businessId,
        saleData.customerId || null,
        saleData.customerName,
        saleData.customerPhone,
        saleData.saleNumber,
        saleData.subtotal,
        saleData.totalAmount,
        saleData.discountAmount,
        saleData.taxAmount,
        saleData.paymentMethod,
        saleData.paymentStatus,
        saleData.status || 'completed',
        saleData.notes || null,
        saleData.createdBy,
      ],
    );

    const saleId = (saleResult as any).insertId;

    // Insert sale items
    for (const item of saleItems) {
      await connection.execute(
        `INSERT INTO sale_items (
          sale_id, product_id, quantity, unit_price, discount, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [saleId, item.productId, item.quantity, item.unitPrice, item.discount, item.subtotal],
      );
    }

    // Update inventory
    for (const update of inventoryUpdates) {
      await connection.execute(
        `UPDATE products 
         SET current_stock = current_stock - ?, 
             updated_at = NOW()
         WHERE id = ? AND business_id = ?`,
        [update.quantity, update.productId, saleData.businessId],
      );

      // Log inventory movement
      await connection.execute(
        `INSERT INTO inventory_movements (
          product_id, business_id, quantity, movement_type,
          reference_type, reference_id, notes, created_by
        ) VALUES (?, ?, ?, 'sale', 'sale', ?, ?, ?)`,
        [
          update.productId,
          saleData.businessId,
          -update.quantity,
          saleId,
          `Sale #${saleData.saleNumber}`,
          saleData.createdBy,
        ],
      );
    }

    return { saleId, saleNumber: saleData.saleNumber };
  });
}

/**
 * Transaction helper for product stock adjustments
 */
export async function executeStockAdjustmentTransaction(
  productId: number,
  businessId: number,
  adjustment: number,
  adjustmentType: 'addition' | 'removal' | 'correction',
  notes: string,
  userId: number,
): Promise<void> {
  return withTransaction(async (connection) => {
    // Update product stock
    const operator = adjustmentType === 'removal' ? '-' : '+';
    await connection.execute(
      `UPDATE products 
       SET current_stock = current_stock ${operator} ?,
           updated_at = NOW()
       WHERE id = ? AND business_id = ?`,
      [adjustment, productId, businessId],
    );

    // Log inventory movement
    await connection.execute(
      `INSERT INTO inventory_movements (
        product_id, business_id, quantity, movement_type,
        reference_type, reference_id, notes, created_by
      ) VALUES (?, ?, ?, ?, 'manual', NULL, ?, ?)`,
      [productId, businessId, adjustment, adjustmentType, notes, userId],
    );
  });
}

/**
 * Transaction helper for refund operations
 */
export async function executeRefundTransaction(
  saleId: number,
  refundItems: any[],
  refundAmount: number,
  reason: string,
  userId: number,
): Promise<void> {
  return withTransaction(async (connection) => {
    // Get sale details
    const [sales] = await connection.execute(
      `SELECT * FROM sales WHERE id = ?`,
      [saleId],
    );

    if (!sales || (sales as any[]).length === 0) {
      throw new Error('Sale not found');
    }

    const sale = (sales as any[])[0];

    // Update sale status
    await connection.execute(
      `UPDATE sales 
       SET status = 'refunded', 
           refund_amount = ?,
           refund_reason = ?,
           refund_date = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [refundAmount, reason, saleId],
    );

    // Restore inventory for refunded items
    for (const item of refundItems) {
      await connection.execute(
        `UPDATE products 
         SET current_stock = current_stock + ?,
             updated_at = NOW()
         WHERE id = ? AND business_id = ?`,
        [item.quantity, item.productId, sale.business_id],
      );

      // Log inventory movement
      await connection.execute(
        `INSERT INTO inventory_movements (
          product_id, business_id, quantity, movement_type,
          reference_type, reference_id, notes, created_by
        ) VALUES (?, ?, ?, 'refund', 'sale', ?, ?, ?)`,
        [
          item.productId,
          sale.business_id,
          item.quantity,
          saleId,
          `Refund: ${reason}`,
          userId,
        ],
      );
    }
  });
}

export default {
  withTransaction,
  executeTransactionQueries,
  isInTransaction,
  executeSaleTransaction,
  executeStockAdjustmentTransaction,
  executeRefundTransaction,
};
