"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyController = void 0;
const database_1 = require("../config/database");
const agentKit_1 = require("../utils/agentKit");
class SurveyController {
    /**
     * Create a new survey
     */
    static async createSurvey(req, res) {
        try {
            const { title, description, questions } = req.body;
            if (!title || !questions || questions.length === 0) {
                return res.status(400).json({ error: 'Title and questions are required' });
            }
            const surveyId = `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Insert survey
            await (0, database_1.query)(`INSERT INTO surveys (id, title, description, questions, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [surveyId, title, description, JSON.stringify(questions), true, new Date(), new Date()]);
            res.status(201).json({
                message: 'Survey created successfully',
                survey_id: surveyId
            });
        }
        catch (error) {
            console.error('Error creating survey:', error);
            res.status(500).json({ error: 'Failed to create survey' });
        }
    }
    /**
     * Get survey by ID
     */
    static async getSurvey(req, res) {
        try {
            const { id } = req.params;
            const result = await (0, database_1.query)('SELECT * FROM surveys WHERE id = $1 AND is_active = true', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Survey not found' });
            }
            const survey = result.rows[0];
            res.json({
                id: survey.id,
                title: survey.title,
                description: survey.description,
                questions: survey.questions,
                created_at: survey.created_at
            });
        }
        catch (error) {
            console.error('Error fetching survey:', error);
            res.status(500).json({ error: 'Failed to fetch survey' });
        }
    }
    /**
     * Submit survey response
     */
    static async submitResponse(req, res) {
        try {
            const { survey_id } = req.params;
            const { responses, respondent_email, respondent_name } = req.body;
            if (!responses || typeof responses !== 'object') {
                return res.status(400).json({ error: 'Responses are required' });
            }
            // Verify survey exists
            const surveyResult = await (0, database_1.query)('SELECT * FROM surveys WHERE id = $1 AND is_active = true', [survey_id]);
            if (surveyResult.rows.length === 0) {
                return res.status(404).json({ error: 'Survey not found' });
            }
            const survey = surveyResult.rows[0];
            // Process response with AgentKit for metadata
            const responseObj = {
                id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                survey_id,
                responses,
                respondent_email,
                respondent_name,
                submitted_at: new Date()
            };
            const metadata = await agentKit_1.AgentKitService.processSurveyResponse(survey, responseObj);
            // Insert response
            await (0, database_1.query)(`INSERT INTO survey_responses (id, survey_id, responses, respondent_email, respondent_name, submitted_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                responseObj.id,
                survey_id,
                JSON.stringify(responses),
                respondent_email,
                respondent_name,
                responseObj.submitted_at,
                JSON.stringify(metadata)
            ]);
            res.status(201).json({
                message: 'Response submitted successfully',
                response_id: responseObj.id
            });
        }
        catch (error) {
            console.error('Error submitting response:', error);
            res.status(500).json({ error: 'Failed to submit response' });
        }
    }
    /**
     * Get survey responses
     */
    static async getResponses(req, res) {
        try {
            const { survey_id } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const result = await (0, database_1.query)(`SELECT id, responses, respondent_email, respondent_name, submitted_at, metadata
         FROM survey_responses
         WHERE survey_id = $1
         ORDER BY submitted_at DESC
         LIMIT $2 OFFSET $3`, [survey_id, limit, offset]);
            res.json({
                responses: result.rows,
                total: result.rowCount
            });
        }
        catch (error) {
            console.error('Error fetching responses:', error);
            res.status(500).json({ error: 'Failed to fetch responses' });
        }
    }
}
exports.SurveyController = SurveyController;
//# sourceMappingURL=survey.controller.js.map