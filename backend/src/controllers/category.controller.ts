import { Request, Response } from 'express';
import { query } from '../config/database';
import { ProductCategory, CreateCategoryRequest, UpdateCategoryRequest } from '../models/ProductCategory';

/**
 * Product Category Controller
 * Gestión de categorías de productos
 */
export class CategoryController {
  /**
   * Get all categories
   */
  static async getAllCategories(req: Request, res: Response) {
    try {
      const { active_only } = req.query;
      
      let queryStr = 'SELECT * FROM product_categories';
      const params: any[] = [];
      
      if (active_only === 'true') {
        queryStr += ' WHERE is_active = true';
      }
      
      queryStr += ' ORDER BY name ASC';
      
      const result = await query(queryStr, params);
      
      res.json({
        categories: result.rows,
        total: result.rowCount
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ 
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const result = await query(
        'SELECT * FROM product_categories WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json({ category: result.rows[0] });
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ 
        error: 'Failed to fetch category',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create new category
   */
  static async createCategory(req: Request, res: Response) {
    try {
      const { name, description, is_active = true } = req.body as CreateCategoryRequest;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Category name is required' });
      }
      
      const categoryId = `cat_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
      
      const result = await query(
        `INSERT INTO product_categories (id, name, description, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [categoryId, name.trim(), description?.trim() || null, is_active]
      );
      
      res.status(201).json({
        message: 'Category created successfully',
        category: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error creating category:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: 'Category name already exists',
          message: 'A category with this name already exists'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to create category',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update category
   */
  static async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, is_active } = req.body as UpdateCategoryRequest;
      
      // Check if category exists
      const existingCategory = await query(
        'SELECT * FROM product_categories WHERE id = $1',
        [id]
      );
      
      if (existingCategory.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      // Build update query dynamically
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        params.push(name.trim());
      }
      
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        params.push(description?.trim() || null);
      }
      
      if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        params.push(is_active);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      params.push(id);
      const result = await query(
        `UPDATE product_categories 
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        params
      );
      
      res.json({
        message: 'Category updated successfully',
        category: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error updating category:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: 'Category name already exists',
          message: 'A category with this name already exists'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to update category',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete category (soft delete by setting is_active = false)
   */
  static async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { hard_delete } = req.query;
      
      // Check if category exists
      const existingCategory = await query(
        'SELECT * FROM product_categories WHERE id = $1',
        [id]
      );
      
      if (existingCategory.rows.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      if (hard_delete === 'true') {
        // Hard delete (actually remove from database)
        await query('DELETE FROM product_categories WHERE id = $1', [id]);
        res.json({ message: 'Category permanently deleted' });
      } else {
        // Soft delete (mark as inactive)
        const result = await query(
          'UPDATE product_categories SET is_active = false WHERE id = $1 RETURNING *',
          [id]
        );
        res.json({
          message: 'Category deactivated successfully',
          category: result.rows[0]
        });
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ 
        error: 'Failed to delete category',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get statistics about category usage
   */
  static async getCategoryStats(req: Request, res: Response) {
    try {
      const result = await query(`
        SELECT 
          pc.id,
          pc.name,
          pc.description,
          pc.is_active,
          COUNT(DISTINCT s.id) as survey_count,
          COUNT(DISTINCT se.id) as sensory_evaluation_count,
          COUNT(DISTINCT s.id) + COUNT(DISTINCT se.id) as total_usage
        FROM product_categories pc
        LEFT JOIN surveys s ON s.category_id = pc.id
        LEFT JOIN sensory_evaluations se ON se.category_id = pc.id
        GROUP BY pc.id, pc.name, pc.description, pc.is_active
        ORDER BY total_usage DESC, pc.name ASC
      `);
      
      res.json({
        stats: result.rows
      });
    } catch (error) {
      console.error('Error fetching category stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch category statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}







