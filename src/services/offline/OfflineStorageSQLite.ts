/**
 * SQLite-based Offline Storage Service
 * Handles local data persistence for offline mode using SQLite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from './Database';
import { Product, Customer, Sale } from '../../types';

// Storage Keys (for backward compatibility and non-SQLite data)
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  LAST_SYNC_TIME: '@last_sync_time',
  DB_INITIALIZED: '@db_initialized',
};

export interface PendingSale {
  id: number;
  localId: string;
  data: {
    businessId?: number;
    customer_id?: number;
    customerName?: string;
    customerPhone?: string;
    items: Array<{
      productId: number;
      productName?: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
    }>;
    paymentMethod: string;
    total?: number;
    discountAmount?: number;
    taxRate?: number;
    notes?: string;
  };
  createdAt: string;
  attempts: number;
  lastAttempt?: string;
  syncStatus: 'pending' | 'syncing' | 'failed';
  errorMessage?: string;
}

export interface CachedCredentials {
  login: string;
  passwordHash: string;
  user: any;
  token: string;
  cachedAt: string;
}

class OfflineStorageSQLite {
  private initialized = false;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await database.init();
      this.initialized = true;
      console.log('OfflineStorage SQLite initialized');
    } catch (error) {
      console.error('Failed to initialize OfflineStorage:', error);
      throw error;
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  // ==================== CREDENTIALS ====================

  /**
   * Cache user credentials for offline login
   */
  async cacheCredentials(
    login: string,
    password: string,
    user: any,
    token: string,
  ): Promise<void> {
    await this.ensureInitialized();

    try {
      const passwordHash = this.simpleHash(password);
      const userData = JSON.stringify(user);
      const cachedAt = new Date().toISOString();

      await database.executeSql(
        `INSERT OR REPLACE INTO credentials (login, password_hash, user_data, token, cached_at)
         VALUES (?, ?, ?, ?, ?)`,
        [login, passwordHash, userData, token, cachedAt],
      );

      console.log('Credentials cached for offline login');
    } catch (error) {
      console.error('Error caching credentials:', error);
    }
  }

  /**
   * Verify offline credentials
   */
  async verifyOfflineCredentials(
    login: string,
    password: string,
  ): Promise<{ valid: boolean; user?: any; token?: string }> {
    await this.ensureInitialized();

    try {
      const [result] = await database.executeSql(
        'SELECT * FROM credentials WHERE login = ?',
        [login],
      );

      if (result.rows.length === 0) {
        return { valid: false };
      }

      const row = result.rows.item(0);
      const passwordHash = this.simpleHash(password);

      if (row.password_hash === passwordHash) {
        return {
          valid: true,
          user: JSON.parse(row.user_data),
          token: row.token,
        };
      }

      return { valid: false };
    } catch (error) {
      console.error('Error verifying offline credentials:', error);
      return { valid: false };
    }
  }

  /**
   * Simple hash function for password verification
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Clear cached credentials
   */
  async clearCachedCredentials(): Promise<void> {
    await this.ensureInitialized();
    await database.executeSql('DELETE FROM credentials');
  }

  // ==================== PRODUCTS ====================

  /**
   * Cache products for offline use (bulk insert/update)
   */
  async cacheProducts(products: Product[]): Promise<void> {
    await this.ensureInitialized();

    try {
      const syncedAt = new Date().toISOString();

      // Use transaction for better performance
      await database.transaction([
        // Clear existing products
        { sql: 'DELETE FROM products' },
        // Insert new products
        ...products.map(p => ({
          sql: `INSERT INTO products (
            id, business_id, category_id, name, description, sku, barcode,
            cost_price, buying_price, selling_price, current_stock,
            reorder_level, min_stock_level, unit_of_measure, image_url,
            is_active, category_name, created_at, updated_at, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            p.id,
            p.business_id,
            p.category_id || null,
            p.name,
            p.description || null,
            p.sku || null,
            p.barcode || null,
            p.cost_price || null,
            p.buying_price || null,
            p.selling_price,
            p.current_stock ?? p.quantity_in_stock ?? 0,
            p.reorder_level || null,
            p.min_stock_level || null,
            p.unit_of_measure || p.unit || null,
            p.image_url || p.product_image || null,
            p.is_active !== false ? 1 : 0,
            p.category_name || p.category?.name || null,
            p.created_at || null,
            p.updated_at || null,
            syncedAt,
          ],
        })),
      ]);

      console.log(`Cached ${products.length} products in SQLite`);
    } catch (error) {
      console.error('Error caching products:', error);
    }
  }

  /**
   * Get all cached products
   */
  async getCachedProducts(): Promise<Product[]> {
    await this.ensureInitialized();

    try {
      const [result] = await database.executeSql(
        'SELECT * FROM products WHERE is_active = 1 ORDER BY name',
      );

      const products: Product[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        products.push(this.rowToProduct(row));
      }

      return products;
    } catch (error) {
      console.error('Error getting cached products:', error);
      return [];
    }
  }

  /**
   * Search products by name or barcode
   */
  async searchProducts(query: string): Promise<Product[]> {
    await this.ensureInitialized();

    try {
      const searchTerm = `%${query}%`;
      const [result] = await database.executeSql(
        `SELECT * FROM products 
         WHERE is_active = 1 AND (name LIKE ? OR barcode LIKE ? OR sku LIKE ?)
         ORDER BY name LIMIT 50`,
        [searchTerm, searchTerm, searchTerm],
      );

      const products: Product[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        products.push(this.rowToProduct(result.rows.item(i)));
      }

      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Get product by barcode
   */
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    await this.ensureInitialized();

    try {
      const [result] = await database.executeSql(
        'SELECT * FROM products WHERE barcode = ? AND is_active = 1',
        [barcode],
      );

      if (result.rows.length > 0) {
        return this.rowToProduct(result.rows.item(0));
      }

      return null;
    } catch (error) {
      console.error('Error getting product by barcode:', error);
      return null;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: number): Promise<Product | null> {
    await this.ensureInitialized();

    try {
      const [result] = await database.executeSql(
        'SELECT * FROM products WHERE id = ?',
        [id],
      );

      if (result.rows.length > 0) {
        return this.rowToProduct(result.rows.item(0));
      }

      return null;
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return null;
    }
  }

  /**
   * Update local product stock (after offline sale)
   */
  async updateLocalProductStock(
    productId: number,
    quantitySold: number,
  ): Promise<void> {
    await this.ensureInitialized();

    try {
      await database.executeSql(
        `UPDATE products 
         SET current_stock = MAX(0, current_stock - ?), 
             updated_at = ?
         WHERE id = ?`,
        [quantitySold, new Date().toISOString(), productId],
      );
    } catch (error) {
      console.error('Error updating local product stock:', error);
    }
  }

  /**
   * Convert database row to Product object
   */
  private rowToProduct(row: any): Product {
    return {
      id: row.id,
      business_id: row.business_id,
      category_id: row.category_id,
      name: row.name,
      description: row.description,
      sku: row.sku,
      barcode: row.barcode,
      cost_price: row.cost_price,
      buying_price: row.buying_price,
      selling_price: row.selling_price,
      current_stock: row.current_stock,
      quantity_in_stock: row.current_stock,
      reorder_level: row.reorder_level,
      min_stock_level: row.min_stock_level,
      unit_of_measure: row.unit_of_measure,
      unit: row.unit_of_measure,
      image_url: row.image_url,
      product_image: row.image_url,
      is_active: row.is_active === 1,
      category_name: row.category_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  // ==================== CUSTOMERS ====================

  /**
   * Cache customers for offline use
   */
  async cacheCustomers(customers: Customer[]): Promise<void> {
    await this.ensureInitialized();

    try {
      const syncedAt = new Date().toISOString();

      await database.transaction([
        // Clear existing non-local customers
        { sql: 'DELETE FROM customers WHERE is_local = 0' },
        // Insert new customers
        ...customers.map(c => ({
          sql: `INSERT OR REPLACE INTO customers (
            id, business_id, name, phone, email, address,
            total_purchases, total_orders, loyalty_points, customer_type,
            last_purchase_date, created_at, updated_at, synced_at, is_local
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          params: [
            c.id,
            c.business_id,
            c.name,
            c.phone || null,
            c.email || null,
            c.address || null,
            c.total_purchases || 0,
            c.total_orders || 0,
            c.loyalty_points || 0,
            c.customer_type || 'regular',
            c.last_purchase_date || null,
            c.created_at,
            c.updated_at,
            syncedAt,
          ],
        })),
      ]);

      console.log(`Cached ${customers.length} customers in SQLite`);
    } catch (error) {
      console.error('Error caching customers:', error);
    }
  }

  /**
   * Get all cached customers
   */
  async getCachedCustomers(): Promise<Customer[]> {
    await this.ensureInitialized();

    try {
      const [result] = await database.executeSql(
        'SELECT * FROM customers ORDER BY name',
      );

      const customers: Customer[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        customers.push(this.rowToCustomer(result.rows.item(i)));
      }

      return customers;
    } catch (error) {
      console.error('Error getting cached customers:', error);
      return [];
    }
  }

  /**
   * Search customers by name or phone
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    await this.ensureInitialized();

    try {
      const searchTerm = `%${query}%`;
      const [result] = await database.executeSql(
        `SELECT * FROM customers 
         WHERE name LIKE ? OR phone LIKE ?
         ORDER BY name LIMIT 20`,
        [searchTerm, searchTerm],
      );

      const customers: Customer[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        customers.push(this.rowToCustomer(result.rows.item(i)));
      }

      return customers;
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  /**
   * Convert database row to Customer object
   */
  private rowToCustomer(row: any): Customer {
    return {
      id: row.id,
      business_id: row.business_id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      total_purchases: row.total_purchases,
      total_orders: row.total_orders,
      loyalty_points: row.loyalty_points,
      customer_type: row.customer_type,
      last_purchase_date: row.last_purchase_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  // ==================== PENDING SALES ====================

  /**
   * Add a sale to the pending queue
   */
  async addPendingSale(saleData: PendingSale['data']): Promise<string> {
    await this.ensureInitialized();

    try {
      const localId = this.generateUUID();
      const createdAt = new Date().toISOString();
      const totalAmount = saleData.total || this.calculateTotal(saleData.items);

      // Insert sale
      await database.executeSql(
        `INSERT INTO pending_sales (
          local_id, business_id, customer_id, customer_name, customer_phone,
          payment_method, subtotal, discount_amount, tax_rate, tax_amount,
          total_amount, notes, created_at, attempts, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending')`,
        [
          localId,
          saleData.businessId || null,
          saleData.customer_id || null,
          saleData.customerName || null,
          saleData.customerPhone || null,
          saleData.paymentMethod,
          totalAmount,
          saleData.discountAmount || 0,
          saleData.taxRate || 0,
          ((saleData.taxRate || 0) * totalAmount) / 100,
          totalAmount,
          saleData.notes || null,
          createdAt,
        ],
      );

      // Insert sale items
      for (const item of saleData.items) {
        const product = await this.getProductById(item.productId);
        const subtotal = item.quantity * item.unitPrice - (item.discount || 0);

        await database.executeSql(
          `INSERT INTO pending_sale_items (
            local_sale_id, product_id, product_name, quantity,
            unit_price, discount, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            localId,
            item.productId,
            product?.name || item.productName || 'Unknown Product',
            item.quantity,
            item.unitPrice,
            item.discount || 0,
            subtotal,
          ],
        );
      }

      console.log('Sale added to pending queue:', localId);
      return localId;
    } catch (error) {
      console.error('Error adding pending sale:', error);
      throw error;
    }
  }

  /**
   * Get all pending sales
   */
  async getPendingSales(): Promise<PendingSale[]> {
    await this.ensureInitialized();

    try {
      const [salesResult] = await database.executeSql(
        `SELECT * FROM pending_sales 
         WHERE sync_status IN ('pending', 'failed')
         ORDER BY created_at DESC`,
      );

      const pendingSales: PendingSale[] = [];

      for (let i = 0; i < salesResult.rows.length; i++) {
        const saleRow = salesResult.rows.item(i);

        // Get items for this sale
        const [itemsResult] = await database.executeSql(
          'SELECT * FROM pending_sale_items WHERE local_sale_id = ?',
          [saleRow.local_id],
        );

        const items = [];
        for (let j = 0; j < itemsResult.rows.length; j++) {
          const itemRow = itemsResult.rows.item(j);
          items.push({
            productId: itemRow.product_id,
            productName: itemRow.product_name,
            quantity: itemRow.quantity,
            unitPrice: itemRow.unit_price,
            discount: itemRow.discount,
          });
        }

        pendingSales.push({
          id: saleRow.id,
          localId: saleRow.local_id,
          data: {
            businessId: saleRow.business_id,
            customer_id: saleRow.customer_id,
            customerName: saleRow.customer_name,
            customerPhone: saleRow.customer_phone,
            items,
            paymentMethod: saleRow.payment_method,
            total: saleRow.total_amount,
            discountAmount: saleRow.discount_amount,
            taxRate: saleRow.tax_rate,
            notes: saleRow.notes,
          },
          createdAt: saleRow.created_at,
          attempts: saleRow.attempts,
          lastAttempt: saleRow.last_attempt,
          syncStatus: saleRow.sync_status,
          errorMessage: saleRow.error_message,
        });
      }

      return pendingSales;
    } catch (error) {
      console.error('Error getting pending sales:', error);
      return [];
    }
  }

  /**
   * Get pending sales count
   */
  async getPendingSalesCount(): Promise<number> {
    await this.ensureInitialized();

    try {
      const [result] = await database.executeSql(
        `SELECT COUNT(*) as count FROM pending_sales 
         WHERE sync_status IN ('pending', 'failed')`,
      );

      return result.rows.item(0).count;
    } catch (error) {
      console.error('Error getting pending sales count:', error);
      return 0;
    }
  }

  /**
   * Update pending sale status
   */
  async updatePendingSaleStatus(
    localId: string,
    status: 'pending' | 'syncing' | 'failed' | 'synced',
    errorMessage?: string,
  ): Promise<void> {
    await this.ensureInitialized();

    try {
      await database.executeSql(
        `UPDATE pending_sales 
         SET sync_status = ?, 
             attempts = attempts + 1,
             last_attempt = ?,
             error_message = ?
         WHERE local_id = ?`,
        [status, new Date().toISOString(), errorMessage || null, localId],
      );
    } catch (error) {
      console.error('Error updating pending sale status:', error);
    }
  }

  /**
   * Remove a pending sale (after successful sync)
   */
  async removePendingSale(localId: string): Promise<void> {
    await this.ensureInitialized();

    try {
      // Delete items first (foreign key)
      await database.executeSql(
        'DELETE FROM pending_sale_items WHERE local_sale_id = ?',
        [localId],
      );

      // Delete sale
      await database.executeSql(
        'DELETE FROM pending_sales WHERE local_id = ?',
        [localId],
      );

      console.log('Pending sale removed:', localId);
    } catch (error) {
      console.error('Error removing pending sale:', error);
    }
  }

  /**
   * Update pending sale attempt count (backward compatibility)
   */
  async updatePendingSaleAttempt(localId: string): Promise<void> {
    await this.updatePendingSaleStatus(localId, 'syncing');
  }

  // ==================== SALES CACHE ====================

  /**
   * Cache recent sales for offline viewing
   */
  async cacheSales(sales: Sale[]): Promise<void> {
    await this.ensureInitialized();

    try {
      const syncedAt = new Date().toISOString();

      await database.transaction([
        { sql: 'DELETE FROM sales_cache' },
        ...sales.slice(0, 100).map(s => ({
          sql: `INSERT INTO sales_cache (
            id, business_id, customer_id, customer_name, customer_phone,
            sale_number, sale_date, subtotal, total_amount, discount_amount,
            tax_amount, payment_method, payment_status, status, notes,
            created_at, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            s.id,
            s.business_id,
            s.customer_id || null,
            s.customer_name || null,
            s.customer_phone || null,
            s.sale_number || null,
            s.sale_date,
            s.subtotal || s.total_amount,
            s.total_amount,
            s.discount_amount,
            s.tax_amount,
            s.payment_method,
            s.payment_status,
            s.status || 'completed',
            s.notes || null,
            s.created_at,
            syncedAt,
          ],
        })),
      ]);

      console.log(`Cached ${Math.min(sales.length, 100)} sales`);
    } catch (error) {
      console.error('Error caching sales:', error);
    }
  }

  /**
   * Get cached sales
   */
  async getCachedSales(): Promise<Sale[]> {
    await this.ensureInitialized();

    try {
      const [result] = await database.executeSql(
        'SELECT * FROM sales_cache ORDER BY sale_date DESC',
      );

      const sales: Sale[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        sales.push({
          id: row.id,
          business_id: row.business_id,
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          sale_number: row.sale_number,
          sale_date: row.sale_date,
          subtotal: row.subtotal,
          total_amount: row.total_amount,
          discount_amount: row.discount_amount,
          tax_amount: row.tax_amount,
          payment_method: row.payment_method,
          payment_status: row.payment_status,
          status: row.status,
          notes: row.notes,
          created_by: 0,
          created_at: row.created_at,
          updated_at: row.created_at,
        });
      }

      return sales;
    } catch (error) {
      console.error('Error getting cached sales:', error);
      return [];
    }
  }

  // ==================== SYNC STATE ====================

  /**
   * Update last sync time
   */
  async setLastSyncTime(): Promise<void> {
    const timestamp = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, timestamp);
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
  }

  /**
   * Log sync operation
   */
  async logSync(
    syncType: string,
    status: 'started' | 'completed' | 'failed',
    itemsSynced?: number,
    itemsFailed?: number,
    errorMessage?: string,
  ): Promise<void> {
    await this.ensureInitialized();

    try {
      if (status === 'started') {
        await database.executeSql(
          `INSERT INTO sync_log (sync_type, status, started_at)
           VALUES (?, 'in_progress', ?)`,
          [syncType, new Date().toISOString()],
        );
      } else {
        await database.executeSql(
          `UPDATE sync_log 
           SET status = ?, items_synced = ?, items_failed = ?, 
               error_message = ?, completed_at = ?
           WHERE id = (SELECT MAX(id) FROM sync_log WHERE sync_type = ?)`,
          [
            status,
            itemsSynced || 0,
            itemsFailed || 0,
            errorMessage || null,
            new Date().toISOString(),
            syncType,
          ],
        );
      }
    } catch (error) {
      console.error('Error logging sync:', error);
    }
  }

  // ==================== UTILITIES ====================

  /**
   * Generate a UUID for local records
   */
  private generateUUID(): string {
    return (
      'offline_' +
      Date.now() +
      '_' +
      Math.random().toString(36).substring(2, 11)
    );
  }

  /**
   * Calculate total from items
   */
  private calculateTotal(
    items: Array<{ quantity: number; unitPrice: number; discount?: number }>,
  ): number {
    return items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const discount = item.discount || 0;
      return sum + (itemTotal - discount);
    }, 0);
  }

  /**
   * Get database stats
   */
  async getStats(): Promise<{
    products: number;
    customers: number;
    pendingSales: number;
    cachedSales: number;
  }> {
    await this.ensureInitialized();

    try {
      const [productsResult] = await database.executeSql(
        'SELECT COUNT(*) as count FROM products',
      );
      const [customersResult] = await database.executeSql(
        'SELECT COUNT(*) as count FROM customers',
      );
      const [pendingResult] = await database.executeSql(
        `SELECT COUNT(*) as count FROM pending_sales 
         WHERE sync_status IN ('pending', 'failed')`,
      );
      const [salesResult] = await database.executeSql(
        'SELECT COUNT(*) as count FROM sales_cache',
      );

      return {
        products: productsResult.rows.item(0).count,
        customers: customersResult.rows.item(0).count,
        pendingSales: pendingResult.rows.item(0).count,
        cachedSales: salesResult.rows.item(0).count,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { products: 0, customers: 0, pendingSales: 0, cachedSales: 0 };
    }
  }

  /**
   * Clear all offline data
   */
  async clearAllOfflineData(): Promise<void> {
    await this.ensureInitialized();

    try {
      await database.transaction([
        { sql: 'DELETE FROM products' },
        { sql: 'DELETE FROM customers' },
        { sql: 'DELETE FROM pending_sale_items' },
        { sql: 'DELETE FROM pending_sales' },
        { sql: 'DELETE FROM sales_cache' },
        { sql: 'DELETE FROM credentials' },
        { sql: 'DELETE FROM sync_log' },
      ]);

      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC_TIME);
      console.log('All offline data cleared');
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }
}

export const offlineStorage = new OfflineStorageSQLite();
export default offlineStorage;
