-- Migration: Add region, project, and authorization fields
-- Run this migration to add new required fields

-- Add region and project fields to surveys table
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS project_location VARCHAR(255);

-- Add region and project fields to survey_responses table
ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

-- Add region and project fields to sensory_evaluations table
ALTER TABLE sensory_evaluations 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

-- Add region and project fields to sensory_products table
ALTER TABLE sensory_products 
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_surveys_region ON surveys(region);
CREATE INDEX IF NOT EXISTS idx_surveys_country ON surveys(country);
CREATE INDEX IF NOT EXISTS idx_surveys_project ON surveys(project_name);
CREATE INDEX IF NOT EXISTS idx_survey_responses_region ON survey_responses(region);
CREATE INDEX IF NOT EXISTS idx_survey_responses_country ON survey_responses(country);
CREATE INDEX IF NOT EXISTS idx_sensory_evaluations_region ON sensory_evaluations(region);
CREATE INDEX IF NOT EXISTS idx_sensory_evaluations_country ON sensory_evaluations(country);

-- Create users table for authorization
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create authorization table for report approvals
CREATE TABLE IF NOT EXISTS report_authorizations (
    id VARCHAR(255) PRIMARY KEY,
    report_id VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'sensory' or 'survey'
    authorized_by VARCHAR(255) REFERENCES users(id),
    authorization_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    winning_formula_threshold DECIMAL(5,2) DEFAULT 70.00, -- Percentage threshold (70% or 80%)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    authorized_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for authorization
CREATE INDEX IF NOT EXISTS idx_report_authorizations_report_id ON report_authorizations(report_id);
CREATE INDEX IF NOT EXISTS idx_report_authorizations_status ON report_authorizations(authorization_status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add month/year extraction helper columns (virtual via functions, but we can add computed columns)
-- We'll use DATE_TRUNC in queries instead

COMMENT ON COLUMN surveys.region IS 'Region where the survey was conducted (e.g., Peru, Chile, Venezuela)';
COMMENT ON COLUMN surveys.country IS 'Country where the survey was conducted';
COMMENT ON COLUMN surveys.project_name IS 'Project name (e.g., Solimar Boquillon, España)';
COMMENT ON COLUMN report_authorizations.winning_formula_threshold IS 'Minimum percentage required for a product to be considered winning formula (70% or 80%)';




