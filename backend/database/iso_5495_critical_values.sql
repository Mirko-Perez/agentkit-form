-- ISO 5495 Critical Values Table
-- Tabla de valores críticos para evaluar significancia estadística en evaluaciones sensoriales
-- Basada en la norma ISO 5495 (Prueba de ordenamiento/ranking)

CREATE TABLE IF NOT EXISTS iso_5495_critical_values (
    id SERIAL PRIMARY KEY,
    num_samples INTEGER NOT NULL, -- Número de muestras (productos)
    num_panelists INTEGER NOT NULL, -- Número de panelistas
    significance_level DECIMAL(4,3) NOT NULL, -- Nivel de significancia (0.2, 0.1, 0.05, 0.01, 0.001)
    critical_value DECIMAL(10,2) NOT NULL, -- Valor crítico para comparar
    test_type VARCHAR(50) DEFAULT 'friedman', -- Tipo de test: 'friedman', 'paired', 'ranking'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(num_samples, num_panelists, significance_level, test_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_iso_critical_lookup 
ON iso_5495_critical_values(num_samples, num_panelists, significance_level, test_type);

-- Insert critical values for Friedman test (common scenarios)
-- Formato: (num_samples, num_panelists, significance_level, critical_value, test_type)

-- Para 3 muestras (productos)
INSERT INTO iso_5495_critical_values (num_samples, num_panelists, significance_level, critical_value, test_type) VALUES
-- 3 productos
(3, 10, 0.200, 3.20, 'friedman'),
(3, 10, 0.100, 4.60, 'friedman'),
(3, 10, 0.050, 6.00, 'friedman'),
(3, 10, 0.010, 8.60, 'friedman'),
(3, 10, 0.001, 12.00, 'friedman'),

(3, 20, 0.200, 3.20, 'friedman'),
(3, 20, 0.100, 4.60, 'friedman'),
(3, 20, 0.050, 6.00, 'friedman'),
(3, 20, 0.010, 9.20, 'friedman'),
(3, 20, 0.001, 13.20, 'friedman'),

(3, 30, 0.200, 3.20, 'friedman'),
(3, 30, 0.100, 4.60, 'friedman'),
(3, 30, 0.050, 6.00, 'friedman'),
(3, 30, 0.010, 9.20, 'friedman'),
(3, 30, 0.001, 13.80, 'friedman'),

(3, 38, 0.200, 3.20, 'friedman'),
(3, 38, 0.100, 4.60, 'friedman'),
(3, 38, 0.050, 6.00, 'friedman'),
(3, 38, 0.010, 9.20, 'friedman'),
(3, 38, 0.001, 14.00, 'friedman'),

(3, 40, 0.200, 3.20, 'friedman'),
(3, 40, 0.100, 4.60, 'friedman'),
(3, 40, 0.050, 6.00, 'friedman'),
(3, 40, 0.010, 9.20, 'friedman'),
(3, 40, 0.001, 14.00, 'friedman'),

(3, 50, 0.200, 3.20, 'friedman'),
(3, 50, 0.100, 4.60, 'friedman'),
(3, 50, 0.050, 6.00, 'friedman'),
(3, 50, 0.010, 9.20, 'friedman'),
(3, 50, 0.001, 14.20, 'friedman'),

(3, 70, 0.200, 3.20, 'friedman'),
(3, 70, 0.100, 4.60, 'friedman'),
(3, 70, 0.050, 6.00, 'friedman'),
(3, 70, 0.010, 9.20, 'friedman'),
(3, 70, 0.001, 14.40, 'friedman'),

(3, 100, 0.200, 3.20, 'friedman'),
(3, 100, 0.100, 4.60, 'friedman'),
(3, 100, 0.050, 6.00, 'friedman'),
(3, 100, 0.010, 9.20, 'friedman'),
(3, 100, 0.001, 14.60, 'friedman'),

-- Para 4 muestras (productos)
(4, 10, 0.200, 5.40, 'friedman'),
(4, 10, 0.100, 7.20, 'friedman'),
(4, 10, 0.050, 8.40, 'friedman'),
(4, 10, 0.010, 11.40, 'friedman'),
(4, 10, 0.001, 15.00, 'friedman'),

(4, 20, 0.200, 5.40, 'friedman'),
(4, 20, 0.100, 7.20, 'friedman'),
(4, 20, 0.050, 9.00, 'friedman'),
(4, 20, 0.010, 12.60, 'friedman'),
(4, 20, 0.001, 17.40, 'friedman'),

(4, 30, 0.200, 5.40, 'friedman'),
(4, 30, 0.100, 7.20, 'friedman'),
(4, 30, 0.050, 9.00, 'friedman'),
(4, 30, 0.010, 12.60, 'friedman'),
(4, 30, 0.001, 18.00, 'friedman'),

(4, 40, 0.200, 5.40, 'friedman'),
(4, 40, 0.100, 7.20, 'friedman'),
(4, 40, 0.050, 9.00, 'friedman'),
(4, 40, 0.010, 12.60, 'friedman'),
(4, 40, 0.001, 18.30, 'friedman'),

(4, 50, 0.200, 5.40, 'friedman'),
(4, 50, 0.100, 7.20, 'friedman'),
(4, 50, 0.050, 9.00, 'friedman'),
(4, 50, 0.010, 12.60, 'friedman'),
(4, 50, 0.001, 18.60, 'friedman'),

(4, 70, 0.200, 5.40, 'friedman'),
(4, 70, 0.100, 7.20, 'friedman'),
(4, 70, 0.050, 9.00, 'friedman'),
(4, 70, 0.010, 12.60, 'friedman'),
(4, 70, 0.001, 19.20, 'friedman'),

(4, 100, 0.200, 5.40, 'friedman'),
(4, 100, 0.100, 7.20, 'friedman'),
(4, 100, 0.050, 9.00, 'friedman'),
(4, 100, 0.010, 12.60, 'friedman'),
(4, 100, 0.001, 19.80, 'friedman'),

-- Para 5 muestras (productos)
(5, 10, 0.200, 7.80, 'friedman'),
(5, 10, 0.100, 10.00, 'friedman'),
(5, 10, 0.050, 11.60, 'friedman'),
(5, 10, 0.010, 15.00, 'friedman'),
(5, 10, 0.001, 19.20, 'friedman'),

(5, 20, 0.200, 7.80, 'friedman'),
(5, 20, 0.100, 10.00, 'friedman'),
(5, 20, 0.050, 12.00, 'friedman'),
(5, 20, 0.010, 16.00, 'friedman'),
(5, 20, 0.001, 22.00, 'friedman'),

(5, 30, 0.200, 7.80, 'friedman'),
(5, 30, 0.100, 10.00, 'friedman'),
(5, 30, 0.050, 12.00, 'friedman'),
(5, 30, 0.010, 16.40, 'friedman'),
(5, 30, 0.001, 22.80, 'friedman'),

(5, 40, 0.200, 7.80, 'friedman'),
(5, 40, 0.100, 10.00, 'friedman'),
(5, 40, 0.050, 12.00, 'friedman'),
(5, 40, 0.010, 16.40, 'friedman'),
(5, 40, 0.001, 23.40, 'friedman'),

(5, 50, 0.200, 7.80, 'friedman'),
(5, 50, 0.100, 10.00, 'friedman'),
(5, 50, 0.050, 12.00, 'friedman'),
(5, 50, 0.010, 16.40, 'friedman'),
(5, 50, 0.001, 23.80, 'friedman'),

(5, 70, 0.200, 7.80, 'friedman'),
(5, 70, 0.100, 10.00, 'friedman'),
(5, 70, 0.050, 12.00, 'friedman'),
(5, 70, 0.010, 16.40, 'friedman'),
(5, 70, 0.001, 24.40, 'friedman'),

(5, 100, 0.200, 7.80, 'friedman'),
(5, 100, 0.100, 10.00, 'friedman'),
(5, 100, 0.050, 12.00, 'friedman'),
(5, 100, 0.010, 16.40, 'friedman'),
(5, 100, 0.001, 25.20, 'friedman')

ON CONFLICT (num_samples, num_panelists, significance_level, test_type) DO NOTHING;

-- Function to get critical value for a given scenario
CREATE OR REPLACE FUNCTION get_iso_5495_critical_value(
    p_num_samples INTEGER,
    p_num_panelists INTEGER,
    p_significance_level DECIMAL DEFAULT 0.05,
    p_test_type VARCHAR DEFAULT 'friedman'
)
RETURNS DECIMAL AS $$
DECLARE
    v_critical_value DECIMAL;
    v_closest_panelists INTEGER;
BEGIN
    -- First try exact match
    SELECT critical_value INTO v_critical_value
    FROM iso_5495_critical_values
    WHERE num_samples = p_num_samples
      AND num_panelists = p_num_panelists
      AND significance_level = p_significance_level
      AND test_type = p_test_type;
    
    -- If exact match found, return it
    IF FOUND THEN
        RETURN v_critical_value;
    END IF;
    
    -- If no exact match, find closest panelist count (rounding up for conservative estimate)
    SELECT num_panelists INTO v_closest_panelists
    FROM iso_5495_critical_values
    WHERE num_samples = p_num_samples
      AND num_panelists >= p_num_panelists
      AND significance_level = p_significance_level
      AND test_type = p_test_type
    ORDER BY num_panelists ASC
    LIMIT 1;
    
    -- Get critical value for closest match
    IF FOUND THEN
        SELECT critical_value INTO v_critical_value
        FROM iso_5495_critical_values
        WHERE num_samples = p_num_samples
          AND num_panelists = v_closest_panelists
          AND significance_level = p_significance_level
          AND test_type = p_test_type;
        
        RETURN v_critical_value;
    END IF;
    
    -- If still no match, return NULL (will need chi-square approximation)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if result is statistically significant per ISO 5495
CREATE OR REPLACE FUNCTION check_iso_5495_significance(
    p_num_samples INTEGER,
    p_num_panelists INTEGER,
    p_test_statistic DECIMAL,
    p_significance_level DECIMAL DEFAULT 0.05,
    p_test_type VARCHAR DEFAULT 'friedman'
)
RETURNS TABLE(
    is_significant BOOLEAN,
    critical_value DECIMAL,
    test_statistic DECIMAL,
    significance_level DECIMAL,
    interpretation TEXT
) AS $$
DECLARE
    v_critical_value DECIMAL;
    v_is_significant BOOLEAN;
    v_interpretation TEXT;
BEGIN
    -- Get critical value
    v_critical_value := get_iso_5495_critical_value(
        p_num_samples,
        p_num_panelists,
        p_significance_level,
        p_test_type
    );
    
    -- Check if significant
    IF v_critical_value IS NULL THEN
        -- Use chi-square approximation for large samples
        -- For Friedman test: critical value ≈ chi-square with (k-1) degrees of freedom
        v_critical_value := CASE p_significance_level
            WHEN 0.05 THEN CASE p_num_samples
                WHEN 3 THEN 5.99
                WHEN 4 THEN 7.81
                WHEN 5 THEN 9.49
                ELSE 9.49 -- conservative
            END
            ELSE 5.99 -- default conservative
        END;
        
        v_interpretation := 'Aproximación Chi-cuadrado (muestra grande)';
    ELSE
        v_interpretation := 'Valor crítico según ISO 5495';
    END IF;
    
    v_is_significant := p_test_statistic >= v_critical_value;
    
    IF v_is_significant THEN
        v_interpretation := v_interpretation || ' - HAY diferencias estadísticamente significativas entre las muestras';
    ELSE
        v_interpretation := v_interpretation || ' - NO hay diferencias estadísticamente significativas entre las muestras';
    END IF;
    
    RETURN QUERY SELECT
        v_is_significant,
        v_critical_value,
        p_test_statistic,
        p_significance_level,
        v_interpretation;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE iso_5495_critical_values IS 'Valores críticos según norma ISO 5495 para evaluaciones sensoriales';
COMMENT ON FUNCTION get_iso_5495_critical_value IS 'Obtiene el valor crítico para un escenario dado (número de muestras, panelistas, nivel de significancia)';
COMMENT ON FUNCTION check_iso_5495_significance IS 'Determina si un resultado es estadísticamente significativo según ISO 5495';







