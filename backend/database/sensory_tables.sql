-- Sensory evaluation tables
CREATE TABLE IF NOT EXISTS sensory_products (
    id VARCHAR(255) PRIMARY KEY,
    evaluation_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS sensory_evaluations (
    id VARCHAR(255) PRIMARY KEY,
    evaluation_id VARCHAR(255) NOT NULL,
    panelist_id VARCHAR(255) NOT NULL,
    panelist_name VARCHAR(255),
    panelist_email VARCHAR(255),
    preferences JSONB NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT false
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sensory_products_evaluation_id ON sensory_products(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_sensory_evaluations_evaluation_id ON sensory_evaluations(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_sensory_products_deleted ON sensory_products(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sensory_evaluations_deleted ON sensory_evaluations(is_deleted);
