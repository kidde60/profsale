#!/usr/bin/env node

// scripts/backup.js - Database backup script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
  dbHost: process.env.DB_HOST || 'localhost',
  dbUser: process.env.DB_USER || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'prof_sale',
  dbPort: process.env.DB_PORT || 3306,
  backupDir: process.env.BACKUP_DIR || './backups',
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
};

// Ensure backup directory exists
const backupDirPath = path.resolve(__dirname, '..', config.backupDir);
if (!fs.existsSync(backupDirPath)) {
  fs.mkdirSync(backupDirPath, { recursive: true });
}

/**
 * Generate backup filename
 */
function generateBackupFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${config.dbName}_backup_${timestamp}.sql`;
}

/**
 * Create database backup
 */
function createBackup() {
  const filename = generateBackupFilename();
  const filepath = path.join(backupDirPath, filename);

  console.log(`🔄 Creating backup: ${filename}`);

  try {
    const mysqldumpCommand = `mysqldump -h ${config.dbHost} -P ${config.dbPort} -u ${config.dbUser} -p${config.dbPassword} ${config.dbName} > "${filepath}"`;

    execSync(mysqldumpCommand, { stdio: 'inherit' });

    // Compress the backup
    const gzipCommand = `gzip "${filepath}"`;
    execSync(gzipCommand, { stdio: 'inherit' });

    const compressedFile = `${filepath}.gz`;
    const stats = fs.statSync(compressedFile);

    console.log(`✅ Backup created successfully: ${compressedFile}`);
    console.log(`📦 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    return compressedFile;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

/**
 * Clean old backups
 */
function cleanOldBackups() {
  console.log(`🧹 Cleaning backups older than ${config.retentionDays} days`);

  try {
    const files = fs.readdirSync(backupDirPath);
    const now = Date.now();
    const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    files.forEach(file => {
      const filepath = path.join(backupDirPath, file);
      const stats = fs.statSync(filepath);
      const fileAge = now - stats.mtimeMs;

      if (
        fileAge > retentionMs &&
        (file.endsWith('.sql') || file.endsWith('.sql.gz'))
      ) {
        fs.unlinkSync(filepath);
        console.log(`🗑️  Deleted old backup: ${file}`);
        deletedCount++;
      }
    });

    console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    // Don't throw - cleanup failure shouldn't fail the backup
  }
}

/**
 * Main backup function
 */
async function main() {
  console.log('🚀 Starting database backup process');
  console.log(
    `📊 Database: ${config.dbName} @ ${config.dbHost}:${config.dbPort}`,
  );
  console.log('');

  try {
    // Create backup
    createBackup();

    // Clean old backups
    cleanOldBackups();

    console.log('');
    console.log('✨ Backup process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('💥 Backup process failed');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { createBackup, cleanOldBackups, main };
