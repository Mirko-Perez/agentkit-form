import { Survey, SurveyResponse } from '../models/Survey';
import { SurveyReport } from '../models/Report';
import { QuestionStats } from '../models/Report';
export declare class AgentKitService {
    /**
     * Analyze survey responses using OpenAI to generate insights
     */
    static generateSurveyInsights(survey: Survey, responses: SurveyResponse[], stats: QuestionStats[]): Promise<string[]>;
    /**
     * Process a survey response and extract metadata using AI
     */
    static processSurveyResponse(survey: Survey, response: SurveyResponse): Promise<Record<string, any>>;
    /**
     * Generate a summary report using AI
     */
    static generateReportSummary(report: SurveyReport): Promise<string>;
    private static buildInsightsPrompt;
    private static parseInsights;
}
//# sourceMappingURL=agentKit.d.ts.map