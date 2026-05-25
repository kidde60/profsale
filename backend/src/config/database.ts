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

const inlineCa = process.env.CA_CERT;
const sslCertPath = process.env.CA;

const resolveCertificate = (): string | undefined => {
  if (inlineCa) {
    return inlineCa.includes('---') ? inlineCa.replace(/\\n/g, '\n') : inlineCa;
  }

  if (sslCertPath) {
    try {
      return fs.readFileSync(sslCertPath, 'utf8');
    } catch (error) {
      console.warn(`⚠️  Unable to load CA certificate from ${sslCertPath}.`);
    }
  }

  return undefined;
};

const caCertificate = resolveCertificate();

if (caCertificate) {
  dbConfig.ssl = {
    ca: caCertificate,
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  };
  console.log('🔒 TLS enabled for database connections');
} else if (process.env.NODE_ENV === 'production') {
  console.warn('⚠️  No CA certificate configured. Set CA_CERT (PEM contents) or CA (file path).');
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
