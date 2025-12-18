/**
 * Product Category Model
 * Modelo para categorías de productos (mayonesa, salsa, ketchup, etc.)
 */

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}









