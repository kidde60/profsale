import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Get all expenses with filtering and pagination
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.businessId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    const businessId = req.user.businessId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    // Filters
    const category = req.query.category as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const paymentMethod = req.query.payment_method as string;

    let whereClause = 'WHERE e.business_id = ?';
    const queryParams: any[] = [businessId];

    if (category) {
      whereClause += ' AND e.category = ?';
      queryParams.push(category);
    }

    if (startDate) {
      whereClause += ' AND e.expense_date >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND e.expense_date <= ?';
      queryParams.push(endDate);
    }

    if (paymentMethod) {
      whereClause += ' AND e.payment_method = ?';
      queryParams.push(paymentMethod);
    }

    // Get total count
    const [countResult] = await pool.execute<any[]>(
      `SELECT COUNT(*) as total FROM expenses e ${whereClause}`,
      queryParams,
    );
    const total = countResult[0].total;

    // Get expenses
    const [expenses] = await pool.execute<any[]>(
      `SELECT 
        e.id, e.description, e.amount, e.category, e.expense_date,
        e.payment_method, e.payment_reference, e.receipt_url, e.notes,
        e.created_at, e.updated_at,
        u.first_name, u.last_name
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      ${whereClause}
      ORDER BY e.expense_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Get expense summary
router.get(
  '/summary',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }
      const businessId = req.user.businessId;

      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;

      let whereClause = 'WHERE business_id = ?';
      const queryParams: any[] = [businessId];

      if (startDate) {
        whereClause += ' AND expense_date >= ?';
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND expense_date <= ?';
        queryParams.push(endDate);
      }

      // Get total expenses
      const [totalResult] = await pool.execute<any[]>(
        `SELECT 
        COUNT(*) as total_count,
        SUM(amount) as total_amount
      FROM expenses
      ${whereClause}`,
        queryParams,
      );

      // Get expenses by category
      const [categoryBreakdown] = await pool.execute<any[]>(
        `SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM expenses
      ${whereClause}
      GROUP BY category
      ORDER BY total DESC`,
        queryParams,
      );

      // Get expenses by payment method
      const [paymentMethodBreakdown] = await pool.execute<any[]>(
        `SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total
      FROM expenses
      ${whereClause}
      GROUP BY payment_method`,
        queryParams,
      );

      res.json({
        success: true,
        data: {
          total: totalResult[0],
          byCategory: categoryBreakdown,
          byPaymentMethod: paymentMethodBreakdown,
        },
      });
    } catch (error) {
      console.error('Get expense summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expense summary',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Get single expense
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user?.businessId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }
    const businessId = req.user.businessId;
    const expenseId = parseInt(req.params.id as string);

    if (isNaN(expenseId)) {
      res.status(400).json({
        success: false,
        message: 'Valid expense ID is required',
      });
      return;
    }

    const [expenses] = await pool.execute<any[]>(
      `SELECT 
        e.id, e.description, e.amount, e.category, e.expense_date,
        e.payment_method, e.payment_reference, e.receipt_url, e.notes,
        e.created_at, e.updated_at,
        u.first_name, u.last_name, u.email
      FROM expenses e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ? AND e.business_id = ?`,
      [expenseId, businessId],
    );

    if (expenses.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
      return;
    }

    res.json({
      success: true,
      data: expenses[0],
    });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error:
        process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : undefined,
    });
  }
});

// Create new expense
router.post(
  '/',
  authenticateToken,
  requirePermission('create_expense'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }
      const businessId = req.user.businessId;
      const userId = req.user.id;

      const {
        description,
        amount,
        category,
        expenseDate,
        paymentMethod = 'cash',
        paymentReference,
        receiptUrl,
        notes,
      } = req.body;

      // Validation
      if (!description || !amount || !category || !expenseDate) {
        res.status(400).json({
          success: false,
          message:
            'Description, amount, category, and expense date are required',
        });
        return;
      }

      if (parseFloat(amount) <= 0) {
        res.status(400).json({
          success: false,
          message: 'Amount must be greater than zero',
        });
        return;
      }

      const [result] = await pool.execute<any>(
        `INSERT INTO expenses 
      (business_id, description, amount, category, expense_date, 
       payment_method, payment_reference, receipt_url, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          businessId,
          description,
          amount,
          category,
          expenseDate,
          paymentMethod,
          paymentReference || null,
          receiptUrl || null,
          notes || null,
          userId,
        ],
      );

      const [createdExpense] = await pool.execute<any[]>(
        `SELECT 
        e.id, e.description, e.amount, e.category, e.expense_date,
        e.payment_method, e.payment_reference, e.receipt_url, e.notes,
        e.created_at, e.updated_at
      FROM expenses e
      WHERE e.id = ?`,
        [result.insertId],
      );

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: createdExpense[0],
      });
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create expense',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Update expense
router.put(
  '/:id',
  authenticateToken,
  requirePermission('edit_expense'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }
      const businessId = req.user.businessId;
      const expenseId = parseInt(req.params.id as string);

      if (isNaN(expenseId)) {
        res.status(400).json({
          success: false,
          message: 'Valid expense ID is required',
        });
        return;
      }

      const {
        description,
        amount,
        category,
        expenseDate,
        paymentMethod,
        paymentReference,
        receiptUrl,
        notes,
      } = req.body;

      // Check if expense exists
      const [existing] = await pool.execute<any[]>(
        'SELECT id FROM expenses WHERE id = ? AND business_id = ?',
        [expenseId, businessId],
      );

      if (existing.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Expense not found',
        });
        return;
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (amount !== undefined) {
        if (parseFloat(amount) <= 0) {
          res.status(400).json({
            success: false,
            message: 'Amount must be greater than zero',
          });
          return;
        }
        updates.push('amount = ?');
        values.push(amount);
      }
      if (category !== undefined) {
        updates.push('category = ?');
        values.push(category);
      }
      if (expenseDate !== undefined) {
        updates.push('expense_date = ?');
        values.push(expenseDate);
      }
      if (paymentMethod !== undefined) {
        updates.push('payment_method = ?');
        values.push(paymentMethod);
      }
      if (paymentReference !== undefined) {
        updates.push('payment_reference = ?');
        values.push(paymentReference);
      }
      if (receiptUrl !== undefined) {
        updates.push('receipt_url = ?');
        values.push(receiptUrl);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes);
      }

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No fields to update',
        });
        return;
      }

      await pool.execute(
        `UPDATE expenses SET ${updates.join(', ')} WHERE id = ? AND business_id = ?`,
        [...values, expenseId, businessId],
      );

      const [updated] = await pool.execute<any[]>(
        `SELECT 
        e.id, e.description, e.amount, e.category, e.expense_date,
        e.payment_method, e.payment_reference, e.receipt_url, e.notes,
        e.created_at, e.updated_at
      FROM expenses e
      WHERE e.id = ?`,
        [expenseId],
      );

      res.json({
        success: true,
        message: 'Expense updated successfully',
        data: updated[0],
      });
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update expense',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

// Delete expense
router.delete(
  '/:id',
  authenticateToken,
  requirePermission('delete_expense'),
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }
      const businessId = req.user.businessId;
      const expenseId = parseInt(req.params.id as string);

      if (isNaN(expenseId)) {
        res.status(400).json({
          success: false,
          message: 'Valid expense ID is required',
        });
        return;
      }

      const [result] = await pool.execute<any>(
        'DELETE FROM expenses WHERE id = ? AND business_id = ?',
        [expenseId, businessId],
      );

      if (result.affectedRows === 0) {
        res.status(404).json({
          success: false,
          message: 'Expense not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete expense',
        error:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : undefined,
      });
    }
  },
);

export default router;
