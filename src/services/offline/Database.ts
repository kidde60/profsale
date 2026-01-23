/**
 * SQLite Database Service
 * Handles local database for offline capabilities
 */

import SQLite, { SQLiteDatabase, ResultSet } from 'react-native-sqlite-storage';

// Enable promise-based API
SQLite.enablePromise(true);

const DATABASE_NAME = 'profsale_offline.db';
const DATABASE_VERSION = 1;

class DatabaseService {
  private db: SQLiteDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.db = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: 'default',
      });

      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   */
  async getDb(): Promise<SQLiteDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  /**
   * Create all tables
   */
  private async createTables(): Promise<void> {
    const db = this.db!;

    // Products table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        business_id INTEGER,
        category_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT,
        barcode TEXT,
        cost_price REAL,
        buying_price REAL,
        selling_price REAL NOT NULL,
        current_stock INTEGER DEFAULT 0,
        reorder_level INTEGER,
        min_stock_level INTEGER,
        unit_of_measure TEXT,
        image_url TEXT,
        is_active INTEGER DEFAULT 1,
        category_name TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index on barcode for fast lookup
    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)
    `);

    // Create index on name for search
    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)
    `);

    // Customers table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        business_id INTEGER,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        total_purchases REAL DEFAULT 0,
        total_orders INTEGER DEFAULT 0,
        loyalty_points INTEGER DEFAULT 0,
        customer_type TEXT DEFAULT 'regular',
        last_purchase_date TEXT,
        created_at TEXT,
        updated_at TEXT,
        synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_local INTEGER DEFAULT 0
      )
    `);

    // Create index on phone for search
    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)
    `);

    // Pending sales table (offline sales waiting to sync)
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS pending_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_id TEXT UNIQUE NOT NULL,
        business_id INTEGER,
        customer_id INTEGER,
        customer_name TEXT,
        customer_phone TEXT,
        payment_method TEXT NOT NULL,
        subtotal REAL,
        discount_amount REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        total_amount REAL NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        attempts INTEGER DEFAULT 0,
        last_attempt TEXT,
        sync_status TEXT DEFAULT 'pending',
        error_message TEXT
      )
    `);

    // Pending sale items table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS pending_sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_sale_id TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        discount REAL DEFAULT 0,
        subtotal REAL NOT NULL,
        FOREIGN KEY (local_sale_id) REFERENCES pending_sales(local_id) ON DELETE CASCADE
      )
    `);

    // Synced sales cache (for offline viewing)
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS sales_cache (
        id INTEGER PRIMARY KEY,
        business_id INTEGER,
        customer_id INTEGER,
        customer_name TEXT,
        customer_phone TEXT,
        sale_number TEXT,
        sale_date TEXT,
        subtotal REAL,
        total_amount REAL,
        discount_amount REAL,
        tax_amount REAL,
        payment_method TEXT,
        payment_status TEXT,
        status TEXT,
        notes TEXT,
        created_at TEXT,
        synced_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Credentials table (for offline login)
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        login TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        user_data TEXT NOT NULL,
        token TEXT,
        cached_at TEXT NOT NULL
      )
    `);

    // Sync log table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_type TEXT NOT NULL,
        status TEXT NOT NULL,
        items_synced INTEGER DEFAULT 0,
        items_failed INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TEXT NOT NULL,
        completed_at TEXT
      )
    `);

    // App settings/metadata
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('All tables created successfully');
  }

  /**
   * Execute a SQL query with parameters
   */
  async executeSql(sql: string, params: any[] = []): Promise<[ResultSet]> {
    const db = await this.getDb();
    return db.executeSql(sql, params);
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(
    queries: Array<{ sql: string; params?: any[] }>,
  ): Promise<void> {
    const db = await this.getDb();

    await db.transaction(async tx => {
      for (const query of queries) {
        await tx.executeSql(query.sql, query.params || []);
      }
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * Delete database (for testing/reset)
   */
  async deleteDatabase(): Promise<void> {
    await this.close();
    await SQLite.deleteDatabase({ name: DATABASE_NAME, location: 'default' });
    console.log('Database deleted');
  }
}

export const database = new DatabaseService();
export default database;
