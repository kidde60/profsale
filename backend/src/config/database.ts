import fs from 'fs';
import mysql, { PoolOptions } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// connection string: mysql://3jheLzrkoeDj2Aj.root:wS9dQPVF8MdMssFT@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/prof_sale
const dbConfig: PoolOptions = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'dangotech_profsale',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dangotech_ptofsale',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10,
  queueLimit: 0,
  charset: 'utf8mb4',
};

const sslCertPath = process.env.CA;

if (sslCertPath) {
  try {
    const ca = fs.readFileSync(sslCertPath, 'utf8');
    dbConfig.ssl = {
      ca,
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    };
  } catch (error) {
    console.warn(`⚠️  Unable to load CA certificate from ${sslCertPath}. Proceeding without TLS.`);
  }
}

export const pool = mysql.createPool(dbConfig);

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
