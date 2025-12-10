-- View: Comprehensive reports table (planilla de reportes)
-- This view provides a complete table of all generated reports with filters

CREATE OR REPLACE VIEW reports_planilla AS
SELECT 
    gr.id as report_id,
    gr.evaluation_id,
    gr.report_type,
    gr.generated_at,
    gr.expires_at,
    gr.is_valid,
    CASE 
        WHEN gr.report_type = 'sensory' THEN 
            (gr.report_data->>'evaluation_title')::text
        ELSE 
            (gr.report_data->>'survey_title')::text
    END as report_title,
    CASE 
        WHEN gr.report_type = 'sensory' THEN 
            (gr.report_data->>'total_panelists')::integer
        ELSE 
            (gr.report_data->>'total_responses')::integer
    END as total_participants,
    -- Extract region from report metadata or related tables
    COALESCE(
        (SELECT region FROM surveys WHERE id = gr.evaluation_id LIMIT 1),
        (SELECT region FROM sensory_evaluations WHERE evaluation_id = gr.evaluation_id LIMIT 1),
        'N/A'
    ) as region,
    -- Extract country
    COALESCE(
        (SELECT country FROM surveys WHERE id = gr.evaluation_id LIMIT 1),
        (SELECT country FROM sensory_evaluations WHERE evaluation_id = gr.evaluation_id LIMIT 1),
        'N/A'
    ) as country,
    -- Extract project name
    COALESCE(
        (SELECT project_name FROM surveys WHERE id = gr.evaluation_id LIMIT 1),
        (SELECT project_name FROM sensory_evaluations WHERE evaluation_id = gr.evaluation_id LIMIT 1),
        'N/A'
    ) as project_name,
    -- Extract month and year for filtering
    EXTRACT(YEAR FROM gr.generated_at) as report_year,
    EXTRACT(MONTH FROM gr.generated_at) as report_month,
    TO_CHAR(gr.generated_at, 'Month YYYY') as report_month_name,
    -- Authorization status
    COALESCE(
        (SELECT authorization_status FROM report_authorizations WHERE report_id = gr.id LIMIT 1),
        'pending'
    ) as authorization_status,
    -- Winning formula percentage (for sensory reports)
    CASE 
        WHEN gr.report_type = 'sensory' AND gr.report_data->'preference_analysis' IS NOT NULL THEN
            (
                SELECT MAX((pref->>'percentage')::numeric)
                FROM jsonb_array_elements(gr.report_data->'preference_analysis') as pref
            )
        ELSE NULL
    END as winning_formula_percentage,
    -- Check if winning formula meets threshold
    CASE 
        WHEN gr.report_type = 'sensory' THEN
            CASE 
                WHEN (
                    SELECT MAX((pref->>'percentage')::numeric)
                    FROM jsonb_array_elements(gr.report_data->'preference_analysis') as pref
                ) >= COALESCE(
                    (SELECT winning_formula_threshold FROM report_authorizations WHERE report_id = gr.id LIMIT 1),
                    70.00
                ) THEN true
                ELSE false
            END
        ELSE NULL
    END as is_winning_formula,
    -- Number of products/SKUs
    CASE 
        WHEN gr.report_type = 'sensory' THEN
            jsonb_array_length(gr.report_data->'products')
        ELSE NULL
    END as total_products
FROM generated_reports gr
WHERE gr.is_valid = true;

-- Create index on the view (PostgreSQL doesn't support indexes on views directly, 
-- but we can create indexes on the underlying tables)
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at_month 
ON generated_reports((EXTRACT(YEAR FROM generated_at)), (EXTRACT(MONTH FROM generated_at)));

-- Helper function to get reports by month
CREATE OR REPLACE FUNCTION get_reports_by_month(
    p_year INTEGER,
    p_month INTEGER,
    p_region VARCHAR DEFAULT NULL,
    p_country VARCHAR DEFAULT NULL,
    p_project VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    report_id VARCHAR,
    evaluation_id VARCHAR,
    report_type VARCHAR,
    report_title TEXT,
    total_participants INTEGER,
    region VARCHAR,
    country VARCHAR,
    project_name VARCHAR,
    generated_at TIMESTAMP WITH TIME ZONE,
    authorization_status VARCHAR,
    winning_formula_percentage NUMERIC,
    is_winning_formula BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.report_id,
        rp.evaluation_id,
        rp.report_type,
        rp.report_title,
        rp.total_participants,
        rp.region,
        rp.country,
        rp.project_name,
        gr.generated_at,
        rp.authorization_status,
        rp.winning_formula_percentage,
        rp.is_winning_formula
    FROM reports_planilla rp
    JOIN generated_reports gr ON rp.report_id = gr.id
    WHERE rp.report_year = p_year
        AND rp.report_month = p_month
        AND (p_region IS NULL OR rp.region = p_region)
        AND (p_country IS NULL OR rp.country = p_country)
        AND (p_project IS NULL OR rp.project_name = p_project)
    ORDER BY gr.generated_at DESC;
END;
$$ LANGUAGE plpgsql;




