-- Table: report_authorizations
-- Purpose: Store authorization status and metadata for generated reports
-- This table tracks the approval/rejection workflow for reports

CREATE TABLE IF NOT EXISTS report_authorizations (
    id VARCHAR(255) PRIMARY KEY,
    report_id VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'sensory' or 'survey'
    authorization_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    winning_formula_threshold NUMERIC(5, 2) DEFAULT 70.00, -- Threshold percentage (70% or 80%)
    notes TEXT, -- Optional notes from the authorizer
    authorized_by VARCHAR(255), -- User ID or name who authorized the report
    authorized_at TIMESTAMP WITH TIME ZONE, -- Timestamp when authorization was completed (null if pending)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint (optional, can be removed if reports can be deleted)
    CONSTRAINT fk_report_authorizations_report_id 
        FOREIGN KEY (report_id) 
        REFERENCES generated_reports(id) 
        ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_authorizations_report_id 
    ON report_authorizations(report_id);
    
CREATE INDEX IF NOT EXISTS idx_report_authorizations_status 
    ON report_authorizations(authorization_status);
    
CREATE INDEX IF NOT EXISTS idx_report_authorizations_type 
    ON report_authorizations(report_type);

-- Add constraint to ensure valid authorization status (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_authorization_status'
    ) THEN
        ALTER TABLE report_authorizations 
            ADD CONSTRAINT chk_authorization_status 
            CHECK (authorization_status IN ('pending', 'approved', 'rejected'));
    END IF;
END $$;

-- Add constraint to ensure valid report type (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_report_type'
    ) THEN
        ALTER TABLE report_authorizations 
            ADD CONSTRAINT chk_report_type 
            CHECK (report_type IN ('sensory', 'survey'));
    END IF;
END $$;

-- Add constraint to ensure threshold is between 0 and 100 (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_winning_formula_threshold'
    ) THEN
        ALTER TABLE report_authorizations 
            ADD CONSTRAINT chk_winning_formula_threshold 
            CHECK (winning_formula_threshold >= 0 AND winning_formula_threshold <= 100);
    END IF;
END $$;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_report_authorizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_update_report_authorizations_updated_at ON report_authorizations;
CREATE TRIGGER trigger_update_report_authorizations_updated_at
    BEFORE UPDATE ON report_authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_report_authorizations_updated_at();

-- Comments for documentation
COMMENT ON TABLE report_authorizations IS 'Stores authorization status and metadata for generated reports';
COMMENT ON COLUMN report_authorizations.id IS 'Unique identifier for the authorization record';
COMMENT ON COLUMN report_authorizations.report_id IS 'Reference to the generated report';
COMMENT ON COLUMN report_authorizations.report_type IS 'Type of report: sensory or survey';
COMMENT ON COLUMN report_authorizations.authorization_status IS 'Authorization status: pending, approved, or rejected';
COMMENT ON COLUMN report_authorizations.winning_formula_threshold IS 'Threshold percentage for winning formula (typically 70% or 80%)';
COMMENT ON COLUMN report_authorizations.notes IS 'Optional notes from the person who authorized the report';
COMMENT ON COLUMN report_authorizations.authorized_by IS 'User ID or name who authorized the report';
COMMENT ON COLUMN report_authorizations.authorized_at IS 'Timestamp when authorization was completed (null if status is pending)';
