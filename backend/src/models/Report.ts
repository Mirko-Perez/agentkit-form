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
  iso_5495: {
    test_statistic: number;
    critical_value: number;
    significance_level: number;
    is_significant: boolean;
    interpretation: string;
    num_samples: number;
    num_panelists: number;
  };
  pairwise_comparisons: {
    product_a: string;
    product_b: string;
    difference_significant: boolean;
    confidence_level: number;
  }[];
  overall_significance: boolean;
  statistical_approval_recommended?: boolean; // TRUE if statistically significant even if <70%
}

export interface CommentWithFrequency {
  text: string;
  count: number;
  percentage: number;
  is_representative: boolean; // TRUE if >= 3 mentions, FALSE if < 3
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
    top_positive_comments: CommentWithFrequency[];
    top_negative_comments: CommentWithFrequency[];
    common_themes: string[];
    product_specific_feedback?: {
      product_id: string;
      product_name: string;
      product_code?: string;
      first_place_comments: CommentWithFrequency[];
      second_place_comments: CommentWithFrequency[];
      third_place_comments: CommentWithFrequency[];
      total_comments: number;
    }[];
  };
  recommendations: string[];
  generated_at: Date;
  generated_by?: string;
  insights?: string[];
  // New fields for region, project, and winning formula
  region?: string;
  country?: string;
  project_name?: string;
  winning_formula?: {
    product_name: string;
    percentage: number;
    meets_threshold: boolean;
    threshold: number;
  };
  authorization_status?: 'pending' | 'approved' | 'rejected';
}
