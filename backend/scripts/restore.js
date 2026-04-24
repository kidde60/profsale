#!/usr/bin/env node

// scripts/restore.js - Database restore script
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
};

/**
 * List available backups
 */
function listBackups() {
  const backupDirPath = path.resolve(__dirname, '..', config.backupDir);
  
  if (!fs.existsSync(backupDirPath)) {
    console.log('No backup directory found');
    return [];
  }
  
  const files = fs.readdirSync(backupDirPath)
    .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'))
    .map(file => {
      const filepath = path.join(backupDirPath, file);
      const stats = fs.statSync(filepath);
      return {
        name: file,
        path: filepath,
        size: stats.size,
        date: stats.mtime,
        isCompressed: file.endsWith('.gz'),
      };
    })
    .sort((a, b) => b.date - a.date); // Sort by date descending
  
  return files;
}

/**
 * Restore database from backup
 */
function restoreBackup(backupFile) {
  console.log(`🔄 Restoring from: ${backupFile}`);
  
  try {
    const backupDirPath = path.resolve(__dirname, '..', config.backupDir);
    const filepath = path.join(backupDirPath, backupFile);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    // Drop existing database
    console.log('🗑️  Dropping existing database...');
    const dropCommand = `mysql -h ${config.dbHost} -P ${config.dbPort} -u ${config.dbUser} -p${config.dbPassword} -e "DROP DATABASE IF EXISTS ${config.dbName}"`;
    execSync(dropCommand, { stdio: 'inherit' });
    
    // Create new database
    console.log('🏗️  Creating new database...');
    const createCommand = `mysql -h ${config.dbHost} -P ${config.dbPort} -u ${config.dbUser} -p${config.dbPassword} -e "CREATE DATABASE ${config.dbName}"`;
    execSync(createCommand, { stdio: 'inherit' });
    
    // Restore from backup
    console.log('📥 Restoring data...');
    
    if (backupFile.endsWith('.gz')) {
      // Decompress and restore
      const tempFile = filepath.replace('.gz', '');
      execSync(`gunzip -c "${filepath}" > "${tempFile}"`, { stdio: 'inherit' });
      execSync(`mysql -h ${config.dbHost} -P ${config.dbPort} -u ${config.dbUser} -p${config.dbPassword} ${config.dbName} < "${tempFile}"`, { stdio: 'inherit' });
      fs.unlinkSync(tempFile); // Clean up temp file
    } else {
      // Direct restore
      execSync(`mysql -h ${config.dbHost} -P ${config.dbPort} -u ${config.dbUser} -p${config.dbPassword} ${config.dbName} < "${filepath}"`, { stdio: 'inherit' });
    }
    
    console.log('✅ Database restored successfully');
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

/**
 * Main restore function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Available backups:');
    console.log('');
    
    const backups = listBackups();
    
    if (backups.length === 0) {
      console.log('No backups found');
      process.exit(0);
    }
    
    backups.forEach((backup, index) => {
      const size = backup.isCompressed 
        ? `${(backup.size / 1024 / 1024).toFixed(2)} MB (compressed)`
        : `${(backup.size / 1024 / 1024).toFixed(2)} MB`;
      
      console.log(`${index + 1}. ${backup.name}`);
      console.log(`   Date: ${backup.date.toISOString()}`);
      console.log(`   Size: ${size}`);
      console.log('');
    });
    
    console.log('');
    console.log('Usage: node restore.js <backup-file>');
    console.log('Example: node restore.js prof_sale_backup_2024-01-15.sql.gz');
    process.exit(0);
  }
  
  const backupFile = args[0];
  
  console.log('🚀 Starting database restore process');
  console.log(`📊 Database: ${config.dbName} @ ${config.dbHost}:${config.dbPort}`);
  console.log(`📁 Backup: ${backupFile}`);
  console.log('');
  
  try {
    restoreBackup(backupFile);
    
    console.log('');
    console.log('✨ Restore process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('💥 Restore process failed');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { listBackups, restoreBackup, main };
