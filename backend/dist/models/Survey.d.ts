export interface SurveyQuestion {
    id: string;
    type: 'text' | 'multiple_choice' | 'rating' | 'yes_no';
    question: string;
    options?: string[];
    required: boolean;
}
export interface Survey {
    id: string;
    title: string;
    description?: string;
    questions: SurveyQuestion[];
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
}
export interface SurveyResponse {
    id: string;
    survey_id: string;
    responses: Record<string, any>;
    respondent_email?: string;
    respondent_name?: string;
    submitted_at: Date;
    metadata?: Record<string, any>;
}
//# sourceMappingURL=Survey.d.ts.map