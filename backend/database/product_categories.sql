-- Product Categories Table
-- Tabla para gestionar categorías de productos (mayonesa, salsa, ketchup, etc.)

CREATE TABLE IF NOT EXISTS product_categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Add category reference to surveys
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS category_id VARCHAR(255) REFERENCES product_categories(id) ON DELETE SET NULL;

-- Add category reference to sensory_evaluations  
ALTER TABLE sensory_evaluations
ADD COLUMN IF NOT EXISTS category_id VARCHAR(255) REFERENCES product_categories(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_surveys_category ON surveys(category_id);
CREATE INDEX IF NOT EXISTS idx_sensory_evaluations_category ON sensory_evaluations(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);

-- Insert default categories (ejemplos)
INSERT INTO product_categories (id, name, description, is_active) VALUES
    ('cat_mayonesa_' || extract(epoch from now())::bigint, 'Mayonesa', 'Productos tipo mayonesa y aderezos cremosos', true),
    ('cat_salsa_' || (extract(epoch from now())::bigint + 1), 'Salsa', 'Salsas y condimentos líquidos', true),
    ('cat_ketchup_' || (extract(epoch from now())::bigint + 2), 'Ketchup', 'Productos tipo ketchup y salsa de tomate', true),
    ('cat_mostaza_' || (extract(epoch from now())::bigint + 3), 'Mostaza', 'Productos tipo mostaza', true),
    ('cat_bebida_' || (extract(epoch from now())::bigint + 4), 'Bebida', 'Bebidas (té, jugos, refrescos)', true),
    ('cat_lacteo_' || (extract(epoch from now())::bigint + 5), 'Lácteo', 'Productos lácteos (yogurt, leche, queso)', true),
    ('cat_snack_' || (extract(epoch from now())::bigint + 6), 'Snack', 'Snacks y botanas', true),
    ('cat_dulce_' || (extract(epoch from now())::bigint + 7), 'Dulce', 'Dulces, chocolates y confitería', true),
    ('cat_pan_' || (extract(epoch from now())::bigint + 8), 'Pan/Panadería', 'Productos de panadería', true),
    ('cat_otro_' || (extract(epoch from now())::bigint + 9), 'Otro', 'Otras categorías de productos', true)
ON CONFLICT (name) DO NOTHING;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_category_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_timestamp ON product_categories;
CREATE TRIGGER trigger_update_category_timestamp
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_category_updated_at();

-- View to see surveys/evaluations with category info
CREATE OR REPLACE VIEW surveys_with_category AS
SELECT 
    s.*,
    pc.name as category_name,
    pc.description as category_description
FROM surveys s
LEFT JOIN product_categories pc ON s.category_id = pc.id;

CREATE OR REPLACE VIEW sensory_evaluations_with_category AS
SELECT 
    se.*,
    pc.name as category_name,
    pc.description as category_description
FROM sensory_evaluations se
LEFT JOIN product_categories pc ON se.category_id = pc.id;

COMMENT ON TABLE product_categories IS 'Categorías de productos para clasificar encuestas y evaluaciones sensoriales';
COMMENT ON COLUMN product_categories.name IS 'Nombre único de la categoría (ej: Mayonesa, Salsa, Ketchup)';
COMMENT ON COLUMN product_categories.is_active IS 'Indica si la categoría está activa para ser usada';

