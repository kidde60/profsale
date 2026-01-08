#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  try {
    console.log('🔄 Running migrations...\n');

    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'prof_sale',
      multipleStatements: true,
    });

    // Migration files to run in order
    const migrations = [
      'add_subscriptions.sql',
      'add_staff_management.sql',
      'add_sale_items_fields.sql',
      'add_sales_customer_fields.sql',
    ];

    for (const migrationFile of migrations) {
      console.log(`🔄 Running migration: ${migrationFile}...`);

      const migrationPath = path.join(__dirname, 'migrations', migrationFile);

      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Skipping ${migrationFile} (file not found)\n`);
        continue;
      }

      const sql = fs.readFileSync(migrationPath, 'utf8');
      await connection.query(sql);

      console.log(`✅ ${migrationFile} completed successfully!\n`);
    }

    console.log('✅ All migrations completed successfully!');

    await connection.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

runMigration();
