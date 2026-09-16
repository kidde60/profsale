import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { sendErrorResponse, getErrorMessage } from '../utils/errorResponse';

const router = Router();

const getCategoryId = (value: string | string[] | undefined): number | null => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return null;

  const categoryId = Number.parseInt(rawValue, 10);
  return Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null;
};

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;

    if (!businessId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const [categories] = await pool.execute<any[]>(
      `SELECT
        c.id,
        c.name,
        c.description,
        c.created_at,
        c.updated_at,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p
        ON p.category_id = c.id
        AND p.business_id = c.business_id
        AND p.is_active = TRUE
      WHERE c.business_id = ? AND c.is_active = TRUE
      GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
      ORDER BY c.name ASC`,
      [businessId],
    );

    res.json({ success: true, data: { categories } });
  } catch (error) {
    console.error('Get categories error:', error);
    sendErrorResponse(res, 500, 'Failed to fetch categories', getErrorMessage(error));
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const description =
      typeof req.body.description === 'string' ? req.body.description.trim() : '';

    if (!businessId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }

    if (name.length > 100) {
      res.status(400).json({
        success: false,
        message: 'Category name must be 100 characters or fewer',
      });
      return;
    }

    const [existingCategories] = await pool.execute<any[]>(
      `SELECT id FROM categories
       WHERE business_id = ? AND LOWER(name) = LOWER(?) AND is_active = TRUE`,
      [businessId, name],
    );

    if (existingCategories.length > 0) {
      res.status(409).json({
        success: false,
        message: 'A category with this name already exists',
      });
      return;
    }

    const [result] = await pool.execute<any>(
      `INSERT INTO categories (business_id, name, description, is_active)
       VALUES (?, ?, ?, TRUE)`,
      [businessId, name, description || null],
    );

    const [categories] = await pool.execute<any[]>(
      `SELECT id, name, description, created_at, updated_at
       FROM categories
       WHERE id = ? AND business_id = ?`,
      [result.insertId, businessId],
    );

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: categories[0] },
    });
  } catch (error) {
    console.error('Create category error:', error);
    sendErrorResponse(res, 500, 'Failed to create category', getErrorMessage(error));
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const categoryId = getCategoryId(req.params.id);
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const description =
      typeof req.body.description === 'string' ? req.body.description.trim() : '';

    if (!businessId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!categoryId) {
      res.status(400).json({ success: false, message: 'Valid category ID is required' });
      return;
    }

    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }

    if (name.length > 100) {
      res.status(400).json({
        success: false,
        message: 'Category name must be 100 characters or fewer',
      });
      return;
    }

    const [existingCategories] = await pool.execute<any[]>(
      `SELECT id FROM categories
       WHERE id = ? AND business_id = ? AND is_active = TRUE`,
      [categoryId, businessId],
    );

    if (existingCategories.length === 0) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const [duplicateCategories] = await pool.execute<any[]>(
      `SELECT id FROM categories
       WHERE business_id = ?
         AND LOWER(name) = LOWER(?)
         AND id <> ?
         AND is_active = TRUE`,
      [businessId, name, categoryId],
    );

    if (duplicateCategories.length > 0) {
      res.status(409).json({
        success: false,
        message: 'A category with this name already exists',
      });
      return;
    }

    await pool.execute(
      `UPDATE categories
       SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND business_id = ? AND is_active = TRUE`,
      [name, description || null, categoryId, businessId],
    );

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    sendErrorResponse(res, 500, 'Failed to update category', getErrorMessage(error));
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

  try {
    const businessId = req.user?.businessId;
    const categoryId = getCategoryId(req.params.id);

    if (!businessId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!categoryId) {
      res.status(400).json({ success: false, message: 'Valid category ID is required' });
      return;
    }

    const [existingCategories] = await connection.execute<any[]>(
      `SELECT id FROM categories
       WHERE id = ? AND business_id = ? AND is_active = TRUE`,
      [categoryId, businessId],
    );

    if (existingCategories.length === 0) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    await connection.beginTransaction();
    await connection.execute(
      'UPDATE products SET category_id = NULL WHERE category_id = ? AND business_id = ?',
      [categoryId, businessId],
    );
    await connection.execute(
      `UPDATE categories
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND business_id = ?`,
      [categoryId, businessId],
    );
    await connection.commit();

    res.json({
      success: true,
      message: 'Category deleted successfully and products were uncategorized',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete category error:', error);
    sendErrorResponse(res, 500, 'Failed to delete category', getErrorMessage(error));
  } finally {
    connection.release();
  }
});

export default router;
