export interface QuestionStats {
    question_id: string;
    question_text: string;
    total_responses: number;
    response_distribution: Record<string, number>;
    average_rating?: number;
    text_responses?: string[];
}
export interface SurveyReport {
    survey_id: string;
    survey_title: string;
    total_responses: number;
    completion_rate: number;
    average_completion_time?: number;
    questions_stats: QuestionStats[];
    generated_at: Date;
    insights?: string[];
}
export interface ReportFilter {
    survey_id?: string;
    date_from?: Date;
    date_to?: Date;
    respondent_email?: string;
}
//# sourceMappingURL=Report.d.ts.map