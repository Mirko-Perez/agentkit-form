-- Database initialization script for AgentKit Form Application

-- Create database (run this manually or adjust for your setup)
-- CREATE DATABASE agentkit_form;

-- Use the database
-- \c agentkit_form;

-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
    id VARCHAR(255) PRIMARY KEY,
    survey_id VARCHAR(255) NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    responses JSONB NOT NULL,
    respondent_email VARCHAR(255),
    respondent_name VARCHAR(255),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at ON survey_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_email ON survey_responses(respondent_email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for surveys table
CREATE TRIGGER update_surveys_updated_at
    BEFORE UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample survey data (optional)
-- You can remove this section in production
INSERT INTO surveys (id, title, description, questions, is_active) VALUES
('sample_survey_001', 'Customer Satisfaction Survey',
 'Help us improve our services by sharing your feedback',
 '[
   {
     "id": "q1",
     "type": "rating",
     "question": "How satisfied are you with our service?",
     "options": ["1", "2", "3", "4", "5"],
     "required": true
   },
   {
     "id": "q2",
     "type": "multiple_choice",
     "question": "How did you hear about us?",
     "options": ["Social Media", "Search Engine", "Word of Mouth", "Advertisement", "Other"],
     "required": true
   },
   {
     "id": "q3",
     "type": "text",
     "question": "What could we improve?",
     "required": false
   },
   {
     "id": "q4",
     "type": "yes_no",
     "question": "Would you recommend us to a friend?",
     "required": true
   }
 ]',
 true)
ON CONFLICT (id) DO NOTHING;
