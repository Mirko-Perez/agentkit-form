import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Category Routes
 * Rutas para gestión de categorías de productos
 */

// Get all categories (public - needed for import selection)
router.get('/', CategoryController.getAllCategories);

// Get category by ID
router.get('/:id', CategoryController.getCategoryById);

// Get category usage statistics
router.get('/stats/usage', CategoryController.getCategoryStats);

// Create category (admin only)
router.post('/', authenticate, CategoryController.createCategory);

// Update category (admin only)
router.put('/:id', authenticate, CategoryController.updateCategory);

// Delete/deactivate category (admin only)
router.delete('/:id', authenticate, CategoryController.deleteCategory);

export default router;

