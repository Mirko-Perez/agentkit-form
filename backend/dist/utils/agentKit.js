"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentKitService = void 0;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
class AgentKitService {
    /**
     * Analyze survey responses using OpenAI to generate insights
     */
    static async generateSurveyInsights(survey, responses, stats) {
        try {
            const prompt = this.buildInsightsPrompt(survey, responses, stats);
            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert data analyst specializing in survey analysis. Provide actionable insights based on survey responses."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            });
            const insightsText = completion.choices[0]?.message?.content || '';
            return this.parseInsights(insightsText);
        }
        catch (error) {
            console.error('Error generating insights with AgentKit:', error);
            return ['Unable to generate insights at this time.'];
        }
    }
    /**
     * Process a survey response and extract metadata using AI
     */
    static async processSurveyResponse(survey, response) {
        try {
            const prompt = `Analyze this survey response and extract any relevant metadata, sentiment, or patterns:

Survey: ${survey.title}
Questions: ${JSON.stringify(survey.questions)}
Response: ${JSON.stringify(response.responses)}

Please provide:
1. Overall sentiment (positive/negative/neutral)
2. Key themes or topics mentioned
3. Any suggestions or feedback provided
4. Response quality assessment

Format as JSON.`;
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            });
            const metadataText = completion.choices[0]?.message?.content || '{}';
            return JSON.parse(metadataText);
        }
        catch (error) {
            console.error('Error processing response with AgentKit:', error);
            return {};
        }
    }
    /**
     * Generate a summary report using AI
     */
    static async generateReportSummary(report) {
        try {
            const prompt = `Create a comprehensive summary of this survey report:

Survey: ${report.survey_title}
Total Responses: ${report.total_responses}
Completion Rate: ${(report.completion_rate * 100).toFixed(1)}%

Key Statistics:
${report.questions_stats.map(stat => `- ${stat.question_text}: ${stat.total_responses} responses`).join('\n')}

Please provide a professional summary highlighting the most important findings.`;
            const completion = await openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional survey analyst. Create clear, actionable summaries of survey results."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 800,
                temperature: 0.5
            });
            return completion.choices[0]?.message?.content || 'Summary not available.';
        }
        catch (error) {
            console.error('Error generating report summary:', error);
            return 'Unable to generate summary at this time.';
        }
    }
    static buildInsightsPrompt(survey, responses, stats) {
        return `Please analyze this survey data and provide key insights:

Survey Title: ${survey.title}
Description: ${survey.description || 'No description provided'}
Total Responses: ${responses.length}

Question Statistics:
${stats.map((stat) => `
Question: ${stat.question_text}
Total Responses: ${stat.total_responses}
${stat.average_rating ? `Average Rating: ${stat.average_rating.toFixed(1)}` : ''}
Response Distribution: ${JSON.stringify(stat.response_distribution)}
`).join('\n')}

Sample Responses:
${responses.slice(0, 5).map((r, i) => `
Response ${i + 1}: ${JSON.stringify(r.responses)}
`).join('\n')}

Please provide 3-5 key insights about:
1. Overall satisfaction or sentiment
2. Common themes or patterns
3. Areas of concern or improvement
4. Positive aspects highlighted
5. Any correlations or trends`;
    }
    static parseInsights(insightsText) {
        // Split insights by numbered points or bullet points
        const insights = insightsText
            .split(/\d+\.|\*\s*|•\s*/)
            .map(insight => insight.trim())
            .filter(insight => insight.length > 10); // Filter out very short items
        return insights.length > 0 ? insights : [insightsText];
    }
}
exports.AgentKitService = AgentKitService;
//# sourceMappingURL=agentKit.js.map