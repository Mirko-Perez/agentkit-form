-- Fix sensory tables to add missing columns

-- Add category_id to sensory_evaluations
ALTER TABLE sensory_evaluations 
ADD COLUMN IF NOT EXISTS category_id VARCHAR(255) REFERENCES product_categories(id) ON DELETE SET NULL;

-- Add position to sensory_products
ALTER TABLE sensory_products 
ADD COLUMN IF NOT EXISTS position INTEGER;

-- Add region, country, project_name to sensory_evaluations
ALTER TABLE sensory_evaluations 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

-- Add region, project_name to sensory_products
ALTER TABLE sensory_products 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sensory_evaluations_category ON sensory_evaluations(category_id);
CREATE INDEX IF NOT EXISTS idx_sensory_products_position ON sensory_products(position);
CREATE INDEX IF NOT EXISTS idx_sensory_evaluations_region ON sensory_evaluations(region);
CREATE INDEX IF NOT EXISTS idx_sensory_evaluations_country ON sensory_evaluations(country);
CREATE INDEX IF NOT EXISTS idx_sensory_evaluations_project ON sensory_evaluations(project_name);
CREATE INDEX IF NOT EXISTS idx_sensory_products_region ON sensory_products(region);
CREATE INDEX IF NOT EXISTS idx_sensory_products_project ON sensory_products(project_name);









