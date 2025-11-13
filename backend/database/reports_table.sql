-- Table to store generated reports
CREATE TABLE IF NOT EXISTS generated_reports (
    id VARCHAR(255) PRIMARY KEY,
    evaluation_id VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'sensory' or 'survey'
    report_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generated_reports_evaluation_id ON generated_reports(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_expires_at ON generated_reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_valid ON generated_reports(is_valid);

-- Function to automatically clean expired reports
CREATE OR REPLACE FUNCTION clean_expired_reports()
RETURNS void AS $$
BEGIN
    UPDATE generated_reports 
    SET is_valid = false 
    WHERE expires_at < CURRENT_TIMESTAMP AND is_valid = true;
END;
$$ LANGUAGE plpgsql;
