"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const database_1 = require("../config/database");
const agentKit_1 = require("../utils/agentKit");
class ReportController {
    /**
     * Generate survey report with statistics
     */
    static async generateReport(req, res) {
        try {
            const { survey_id } = req.params;
            // Get survey details
            const surveyResult = await (0, database_1.query)('SELECT * FROM surveys WHERE id = $1 AND is_active = true', [survey_id]);
            if (surveyResult.rows.length === 0) {
                return res.status(404).json({ error: 'Survey not found' });
            }
            const survey = surveyResult.rows[0];
            // Get all responses
            const responsesResult = await (0, database_1.query)('SELECT * FROM survey_responses WHERE survey_id = $1 ORDER BY submitted_at DESC', [survey_id]);
            const responses = responsesResult.rows;
            const totalResponses = responses.length;
            if (totalResponses === 0) {
                return res.json({
                    survey_id,
                    survey_title: survey.title,
                    total_responses: 0,
                    completion_rate: 0,
                    questions_stats: [],
                    generated_at: new Date(),
                    message: 'No responses yet'
                });
            }
            // Calculate statistics for each question
            const questionsStats = this.calculateQuestionStats(survey.questions, responses);
            // Generate insights using AgentKit
            const insights = await agentKit_1.AgentKitService.generateSurveyInsights(survey, responses, questionsStats);
            // Generate report summary
            const report = {
                survey_id,
                survey_title: survey.title,
                total_responses: totalResponses,
                completion_rate: 1.0, // Assuming all responses are complete for now
                questions_stats: questionsStats,
                generated_at: new Date(),
                insights
            };
            const summary = await agentKit_1.AgentKitService.generateReportSummary(report);
            res.json({
                ...report,
                summary
            });
        }
        catch (error) {
            console.error('Error generating report:', error);
            res.status(500).json({ error: 'Failed to generate report' });
        }
    }
    /**
     * Get dashboard overview
     */
    static async getDashboardOverview(req, res) {
        try {
            // Get total surveys
            const surveysResult = await (0, database_1.query)('SELECT COUNT(*) as total FROM surveys WHERE is_active = true');
            const totalSurveys = parseInt(surveysResult.rows[0].total);
            // Get total responses
            const responsesResult = await (0, database_1.query)('SELECT COUNT(*) as total FROM survey_responses');
            const totalResponses = parseInt(responsesResult.rows[0].total);
            // Get recent surveys
            const recentSurveysResult = await (0, database_1.query)('SELECT id, title, created_at FROM surveys WHERE is_active = true ORDER BY created_at DESC LIMIT 5');
            // Get response stats by survey
            const statsResult = await (0, database_1.query)(`
        SELECT
          s.id,
          s.title,
          COUNT(sr.id) as response_count,
          MAX(sr.submitted_at) as last_response
        FROM surveys s
        LEFT JOIN survey_responses sr ON s.id = sr.survey_id
        WHERE s.is_active = true
        GROUP BY s.id, s.title
        ORDER BY response_count DESC
        LIMIT 10
      `);
            res.json({
                total_surveys: totalSurveys,
                total_responses: totalResponses,
                recent_surveys: recentSurveysResult.rows,
                survey_stats: statsResult.rows,
                generated_at: new Date()
            });
        }
        catch (error) {
            console.error('Error fetching dashboard overview:', error);
            res.status(500).json({ error: 'Failed to fetch dashboard overview' });
        }
    }
    /**
     * Calculate statistics for each question
     */
    static calculateQuestionStats(questions, responses) {
        return questions.map(question => {
            const questionResponses = responses
                .map(r => {
                const responseData = typeof r.responses === 'string' ? JSON.parse(r.responses) : r.responses;
                return responseData[question.id];
            })
                .filter(answer => answer !== undefined && answer !== null && answer !== '');
            const totalResponses = questionResponses.length;
            const responseDistribution = {};
            // Calculate distribution based on question type
            if (question.type === 'multiple_choice' || question.type === 'yes_no') {
                questionResponses.forEach(answer => {
                    const key = String(answer);
                    responseDistribution[key] = (responseDistribution[key] || 0) + 1;
                });
            }
            else if (question.type === 'rating') {
                // For ratings, group by value
                questionResponses.forEach(answer => {
                    const rating = parseInt(String(answer));
                    if (!isNaN(rating)) {
                        responseDistribution[rating.toString()] = (responseDistribution[rating.toString()] || 0) + 1;
                    }
                });
            }
            else if (question.type === 'text') {
                // For text responses, just count them (we'll store sample responses separately)
                responseDistribution['responses'] = totalResponses;
            }
            // Calculate average rating for rating questions
            let averageRating;
            if (question.type === 'rating' && totalResponses > 0) {
                const ratings = questionResponses
                    .map(r => parseInt(String(r)))
                    .filter(r => !isNaN(r));
                averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
            }
            // Sample text responses (first 3)
            let textResponses;
            if (question.type === 'text' && questionResponses.length > 0) {
                textResponses = questionResponses.slice(0, 3).map(r => String(r));
            }
            return {
                question_id: question.id,
                question_text: question.question,
                total_responses: totalResponses,
                response_distribution: responseDistribution,
                average_rating: averageRating,
                text_responses: textResponses
            };
        });
    }
}
exports.ReportController = ReportController;
//# sourceMappingURL=report.controller.js.map