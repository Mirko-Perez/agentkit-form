-- Fix sensory tables to add missing columns

-- Add category_id to sensory_evaluations
ALTER TABLE sensory_evaluations 
ADD COLUMN IF NOT EXISTS category_id VARCHAR(255) REFERENCES product_categories(id) ON DELETE SET NULL;

-- Add position to sensory_products
ALTER TABLE sensory_products 
ADD COLUMN IF NOT EXISTS position INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sensory_evaluations_category ON sensory_evaluations(category_id);
CREATE INDEX IF NOT EXISTS idx_sensory_products_position ON sensory_products(position);






