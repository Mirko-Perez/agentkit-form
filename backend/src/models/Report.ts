export interface QuestionStats {
  question_id: string;
  question_text: string;
  total_responses: number;
  response_distribution: Record<string, number>;
  average_rating?: number; // For rating questions
  text_responses?: string[]; // For text questions (sample)
}

export interface SurveyReport {
  survey_id: string;
  survey_title: string;
  total_responses: number;
  completion_rate: number;
  average_completion_time?: number;
  questions_stats: QuestionStats[];
  generated_at: Date;
  insights?: string[]; // AI-generated insights using AgentKit
}

export interface ReportFilter {
  survey_id?: string;
  date_from?: Date;
  date_to?: Date;
  respondent_email?: string;
}

// Sensory evaluation specific interfaces
export interface SensoryPreferenceStats {
  product_id: string;
  product_name: string;
  first_place_count: number;
  second_place_count: number;
  third_place_count: number;
  total_votes: number;
  percentage: number;
  average_position: number; // Lower is better (1-3 scale)
}

export interface SensoryStatisticalAnalysis {
  friedman_test: {
    chi_square: number;
    degrees_of_freedom: number;
    p_value: number;
    significant: boolean;
    critical_value: number;
    interpretation: string;
  };
  pairwise_comparisons: {
    product_a: string;
    product_b: string;
    difference_significant: boolean;
    confidence_level: number;
  }[];
  overall_significance: boolean;
}

export interface SensoryReport {
  evaluation_id: string;
  evaluation_title: string;
  total_panelists: number;
  total_evaluations: number;
  completion_rate: number;
  products: {
    id: string;
    name: string;
    code?: string;
    description?: string;
  }[];
  preference_analysis: SensoryPreferenceStats[];
  statistical_analysis: SensoryStatisticalAnalysis;
  qualitative_feedback: {
    top_positive_comments: string[];
    top_negative_comments: string[];
    common_themes: string[];
  };
  recommendations: string[];
  generated_at: Date;
  generated_by?: string;
  insights?: string[];
}
