// config/database.ts - Simple working version
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Simple database configuration that works
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prof_sale',
  port: parseInt(process.env.DB_PORT || '3306'),
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Simple database connection test
export const connectDatabase = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new Error('Failed to connect to database');
  }
};

export default pool;
