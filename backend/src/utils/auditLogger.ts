// utils/auditLogger.ts - Comprehensive audit logging for compliance
import { pool } from '../config/database';
import logger from './logger';

export interface AuditLogData {
  userId?: number;
  staffId?: number;
  businessId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export enum AuditAction {
  // User actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_PASSWORD_CHANGE = 'USER_PASSWORD_CHANGE',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  
  // Product actions
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  PRODUCT_STOCK_ADJUST = 'PRODUCT_STOCK_ADJUST',
  
  // Sale actions
  SALE_CREATE = 'SALE_CREATE',
  SALE_UPDATE = 'SALE_UPDATE',
  SALE_DELETE = 'SALE_DELETE',
  SALE_REFUND = 'SALE_REFUND',
  SALE_CANCEL = 'SALE_CANCEL',
  
  // Customer actions
  CUSTOMER_CREATE = 'CUSTOMER_CREATE',
  CUSTOMER_UPDATE = 'CUSTOMER_UPDATE',
  CUSTOMER_DELETE = 'CUSTOMER_DELETE',
  
  // Expense actions
  EXPENSE_CREATE = 'EXPENSE_CREATE',
  EXPENSE_UPDATE = 'EXPENSE_UPDATE',
  EXPENSE_DELETE = 'EXPENSE_DELETE',
  
  // Staff actions
  STAFF_CREATE = 'STAFF_CREATE',
  STAFF_UPDATE = 'STAFF_UPDATE',
  STAFF_DELETE = 'STAFF_DELETE',
  STAFF_PERMISSION_CHANGE = 'STAFF_PERMISSION_CHANGE',
  
  // Business actions
  BUSINESS_UPDATE = 'BUSINESS_UPDATE',
  BUSINESS_SETTINGS_CHANGE = 'BUSINESS_SETTINGS_CHANGE',
  
  // System actions
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  BACKUP_CREATE = 'BACKUP_CREATE',
  BACKUP_RESTORE = 'BACKUP_RESTORE',
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    const query = `
      INSERT INTO audit_logs (
        user_id, staff_id, business_id, action, entity_type, entity_id,
        changes, ip_address, user_agent, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const changesJson = data.changes ? JSON.stringify(data.changes) : null;
    const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;
    
    await pool.execute(query, [
      data.userId || null,
      data.staffId || null,
      data.businessId || null,
      data.action,
      data.entityType,
      data.entityId || null,
      changesJson,
      data.ipAddress || null,
      data.userAgent || null,
      metadataJson,
    ]);
    
    logger.info('Audit log created', {
      action: data.action,
      entityType: data.entityType,
      userId: data.userId,
      businessId: data.businessId,
    });
  } catch (error) {
    logger.error('Failed to create audit log', { error, data });
    // Don't throw error - audit logging should not break the application
  }
}

/**
 * Audit log middleware for Express
 */
export function auditLogMiddleware(action: AuditAction, entityType: string) {
  return async (req: any, res: any, next: any) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to log after response
    res.json = function(data: any) {
      // Log audit event on successful operations
      if (res.statusCode < 400 && req.user) {
        const auditData: AuditLogData = {
          userId: req.user.id,
          staffId: req.user.staffId,
          businessId: req.user.businessId,
          action,
          entityType,
          entityId: req.params.id || (data.data?.id),
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          metadata: {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
          },
        };
        
        // Log changes for update operations
        if (req.method === 'PUT' || req.method === 'PATCH') {
          auditData.changes = {
            before: req.body.before,
            after: req.body,
          };
        }
        
        // Log asynchronously to not block response
        logAuditEvent(auditData).catch(err => {
          logger.error('Async audit log failed', { err });
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(
  entityType: string,
  entityId: number,
  businessId: number,
  limit: number = 100,
): Promise<any[]> {
  try {
    const query = `
      SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email,
        s.name as staff_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN staff_members s ON al.staff_id = s.id
      WHERE al.entity_type = ? 
        AND al.entity_id = ?
        AND al.business_id = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `;
    
    const [rows] = await pool.execute(query, [entityType, entityId, businessId, limit]);
    return rows as any[];
  } catch (error) {
    logger.error('Failed to fetch audit logs', { error, entityType, entityId });
    throw error;
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: number,
  businessId: number,
  startDate?: Date,
  endDate?: Date,
  limit: number = 100,
): Promise<any[]> {
  try {
    let query = `
      SELECT * FROM audit_logs
      WHERE user_id = ? AND business_id = ?
    `;
    const params: any[] = [userId, businessId];
    
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const [rows] = await pool.execute(query, params);
    return rows as any[];
  } catch (error) {
    logger.error('Failed to fetch user audit logs', { error, userId });
    throw error;
  }
}

/**
 * Get audit logs for a business
 */
export async function getBusinessAuditLogs(
  businessId: number,
  filters: {
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: number;
  } = {},
  page: number = 1,
  limit: number = 50,
): Promise<{ logs: any[]; total: number }> {
  try {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        al.*,
        u.first_name,
        u.last_name,
        u.email,
        s.name as staff_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN staff_members s ON al.staff_id = s.id
      WHERE al.business_id = ?
    `;
    const params: any[] = [businessId];
    
    if (filters.action) {
      query += ' AND al.action = ?';
      params.push(filters.action);
    }
    
    if (filters.entityType) {
      query += ' AND al.entity_type = ?';
      params.push(filters.entityType);
    }
    
    if (filters.startDate) {
      query += ' AND al.created_at >= ?';
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      query += ' AND al.created_at <= ?';
      params.push(filters.endDate);
    }
    
    if (filters.userId) {
      query += ' AND al.user_id = ?';
      params.push(filters.userId);
    }
    
    // Get total count
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/,
      'SELECT COUNT(*) as total FROM',
    );
    const [countResult] = await pool.execute(countQuery, params);
    const total = (countResult as any)[0].total;
    
    // Get paginated results
    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.execute(query, params);
    
    return {
      logs: rows as any[],
      total,
    };
  } catch (error) {
    logger.error('Failed to fetch business audit logs', { error, businessId });
    throw error;
  }
}

/**
 * Create audit log table if it doesn't exist
 */
export async function createAuditLogTable(): Promise<void> {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        staff_id INT NULL,
        business_id INT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INT NULL,
        changes JSON NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_audit_business (business_id),
        INDEX idx_audit_user (user_id),
        INDEX idx_audit_staff (staff_id),
        INDEX idx_audit_entity (entity_type, entity_id),
        INDEX idx_audit_action (action),
        INDEX idx_audit_created (created_at),
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (staff_id) REFERENCES staff_members(id) ON DELETE SET NULL,
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await pool.execute(query);
    logger.info('Audit log table created or already exists');
  } catch (error) {
    logger.error('Failed to create audit log table', { error });
    throw error;
  }
}

/**
 * Archive old audit logs
 */
export async function archiveAuditLogs(
  businessId: number,
  olderThanDays: number = 90,
): Promise<number> {
  try {
    const query = `
      DELETE FROM audit_logs
      WHERE business_id = ?
        AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const [result] = await pool.execute(query, [businessId, olderThanDays]);
    const deletedCount = (result as any).affectedRows;
    
    logger.info(`Archived ${deletedCount} audit logs for business ${businessId}`);
    return deletedCount;
  } catch (error) {
    logger.error('Failed to archive audit logs', { error, businessId });
    throw error;
  }
}

export default {
  logAuditEvent,
  auditLogMiddleware,
  getAuditLogs,
  getUserAuditLogs,
  getBusinessAuditLogs,
  createAuditLogTable,
  archiveAuditLogs,
  AuditAction,
};
