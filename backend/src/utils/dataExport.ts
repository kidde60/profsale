// utils/dataExport.ts - Data export functionality (CSV/PDF)
import { Response } from 'express';
import logger from './logger';

export interface ExportOptions {
  format: 'csv' | 'json';
  filename?: string;
  headers?: string[];
}

/**
 * Convert data to CSV format
 */
export function toCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const keys = headers || Object.keys(data[0]);
  const headerRow = keys.join(',');
  
  const dataRows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      // Handle objects/arrays
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Handle strings with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Convert data to JSON format
 */
export function toJSON(data: any[], pretty: boolean = false): string {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Send CSV response
 */
export function sendCSV(res: Response, data: any[], filename: string = 'export.csv', headers?: string[]): void {
  try {
    const csv = toCSV(data, headers);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
    
    logger.info('CSV export successful', { filename, recordCount: data.length });
  } catch (error) {
    logger.error('CSV export failed', { error });
    throw error;
  }
}

/**
 * Send JSON response for download
 */
export function sendJSON(res: Response, data: any[], filename: string = 'export.json', pretty: boolean = false): void {
  try {
    const json = toJSON(data, pretty);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(json);
    
    logger.info('JSON export successful', { filename, recordCount: data.length });
  } catch (error) {
    logger.error('JSON export failed', { error });
    throw error;
  }
}

/**
 * Export sales data
 */
export async function exportSales(
  sales: any[],
  format: 'csv' | 'json' = 'csv',
  res: Response,
): Promise<void> {
  const filename = `sales_${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'csv') {
    const headers = [
      'Sale ID',
      'Sale Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Total Amount',
      'Discount',
      'Tax',
      'Payment Method',
      'Status',
      'Created By',
    ];
    
    const formattedData = sales.map(sale => ({
      'Sale ID': sale.id,
      'Sale Number': sale.sale_number,
      'Date': sale.sale_date,
      'Customer Name': sale.customer_name || '',
      'Customer Phone': sale.customer_phone || '',
      'Total Amount': sale.total_amount,
      'Discount': sale.discount_amount,
      'Tax': sale.tax_amount,
      'Payment Method': sale.payment_method,
      'Status': sale.status,
      'Created By': sale.created_by,
    }));
    
    sendCSV(res, formattedData, `${filename}.csv`, headers);
  } else {
    sendJSON(res, sales, `${filename}.json`, true);
  }
}

/**
 * Export products data
 */
export async function exportProducts(
  products: any[],
  format: 'csv' | 'json' = 'csv',
  res: Response,
): Promise<void> {
  const filename = `products_${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'csv') {
    const headers = [
      'Product ID',
      'Name',
      'Category',
      'SKU',
      'Barcode',
      'Buying Price',
      'Selling Price',
      'Current Stock',
      'Min Stock Level',
      'Unit',
      'Status',
    ];
    
    const formattedData = products.map(product => ({
      'Product ID': product.id,
      'Name': product.name,
      'Category': product.category_name || '',
      'SKU': product.sku || '',
      'Barcode': product.barcode || '',
      'Buying Price': product.buying_price,
      'Selling Price': product.selling_price,
      'Current Stock': product.current_stock,
      'Min Stock Level': product.min_stock_level,
      'Unit': product.unit,
      'Status': product.is_active ? 'Active' : 'Inactive',
    }));
    
    sendCSV(res, formattedData, `${filename}.csv`, headers);
  } else {
    sendJSON(res, products, `${filename}.json`, true);
  }
}

/**
 * Export customers data
 */
export async function exportCustomers(
  customers: any[],
  format: 'csv' | 'json' = 'csv',
  res: Response,
): Promise<void> {
  const filename = `customers_${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'csv') {
    const headers = [
      'Customer ID',
      'Name',
      'Phone',
      'Email',
      'Address',
      'Customer Type',
      'Total Purchases',
      'Total Orders',
      'Last Purchase Date',
    ];
    
    const formattedData = customers.map(customer => ({
      'Customer ID': customer.id,
      'Name': customer.name,
      'Phone': customer.phone || '',
      'Email': customer.email || '',
      'Address': customer.address || '',
      'Customer Type': customer.customer_type,
      'Total Purchases': customer.total_purchases,
      'Total Orders': customer.total_orders,
      'Last Purchase Date': customer.last_purchase_date || '',
    }));
    
    sendCSV(res, formattedData, `${filename}.csv`, headers);
  } else {
    sendJSON(res, customers, `${filename}.json`, true);
  }
}

/**
 * Export expenses data
 */
export async function exportExpenses(
  expenses: any[],
  format: 'csv' | 'json' = 'csv',
  res: Response,
): Promise<void> {
  const filename = `expenses_${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'csv') {
    const headers = [
      'Expense ID',
      'Category',
      'Description',
      'Amount',
      'Date',
      'Created By',
      'Created At',
    ];
    
    const formattedData = expenses.map(expense => ({
      'Expense ID': expense.id,
      'Category': expense.category,
      'Description': expense.description,
      'Amount': expense.amount,
      'Date': expense.expense_date,
      'Created By': expense.created_by,
      'Created At': expense.created_at,
    }));
    
    sendCSV(res, formattedData, `${filename}.csv`, headers);
  } else {
    sendJSON(res, expenses, `${filename}.json`, true);
  }
}

/**
 * Export inventory data
 */
export async function exportInventory(
  products: any[],
  format: 'csv' | 'json' = 'csv',
  res: Response,
): Promise<void> {
  const filename = `inventory_${new Date().toISOString().split('T')[0]}`;
  
  if (format === 'csv') {
    const headers = [
      'Product ID',
      'Name',
      'Category',
      'Current Stock',
      'Min Stock Level',
      'Stock Status',
      'Stock Value',
      'Last Updated',
    ];
    
    const formattedData = products.map(product => {
      const stockStatus = product.current_stock <= product.min_stock_level ? 'Low' : 'Normal';
      const stockValue = product.current_stock * product.buying_price;
      
      return {
        'Product ID': product.id,
        'Name': product.name,
        'Category': product.category_name || '',
        'Current Stock': product.current_stock,
        'Min Stock Level': product.min_stock_level,
        'Stock Status': stockStatus,
        'Stock Value': stockValue,
        'Last Updated': product.updated_at,
      };
    });
    
    sendCSV(res, formattedData, `${filename}.csv`, headers);
  } else {
    sendJSON(res, products, `${filename}.json`, true);
  }
}

/**
 * Export profit and loss report
 */
export async function exportProfitLoss(
  reportData: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    period: string;
  },
  format: 'csv' | 'json' = 'csv',
  res: Response,
): Promise<void> {
  const filename = `profit_loss_${reportData.period}`;
  
  if (format === 'csv') {
    const headers = ['Metric', 'Value', 'Period'];
    
    const formattedData = [
      {
        'Metric': 'Total Revenue',
        'Value': reportData.totalRevenue,
        'Period': reportData.period,
      },
      {
        'Metric': 'Total Cost',
        'Value': reportData.totalCost,
        'Period': reportData.period,
      },
      {
        'Metric': 'Gross Profit',
        'Value': reportData.grossProfit,
        'Period': reportData.period,
      },
      {
        'Metric': 'Total Expenses',
        'Value': reportData.totalExpenses,
        'Period': reportData.period,
      },
      {
        'Metric': 'Net Profit',
        'Value': reportData.netProfit,
        'Period': reportData.period,
      },
      {
        'Metric': 'Profit Margin',
        'Value': `${reportData.profitMargin}%`,
        'Period': reportData.period,
      },
    ];
    
    sendCSV(res, formattedData, `${filename}.csv`, headers);
  } else {
    sendJSON(res, [reportData], `${filename}.json`, true);
  }
}

/**
 * Generic export function
 */
export function exportData(
  data: any[],
  format: 'csv' | 'json' = 'csv',
  res: Response,
  filename: string = 'export',
): void {
  if (format === 'csv') {
    sendCSV(res, data, `${filename}.csv`);
  } else {
    sendJSON(res, data, `${filename}.json`, true);
  }
}

export default {
  toCSV,
  toJSON,
  sendCSV,
  sendJSON,
  exportSales,
  exportProducts,
  exportCustomers,
  exportExpenses,
  exportInventory,
  exportProfitLoss,
  exportData,
};
