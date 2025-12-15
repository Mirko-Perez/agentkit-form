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
  created_at: string;
}

export interface SurveyResponse {
  survey_id: string;
  responses: Record<string, any>;
  respondent_email?: string;
  respondent_name?: string;
}

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
  questions_stats: QuestionStats[];
  generated_at: string;
  insights?: string[];
  summary?: string;
}

// Sensory evaluation types
export interface SensoryProduct {
  id: string;
  name: string;
  code?: string;
  description?: string;
  image_url?: string;
}

export interface SensoryPreferenceStats {
  product_id: string;
  product_name: string;
  first_place_count: number;
  second_place_count: number;
  third_place_count: number;
  total_votes: number;
  percentage: number;
  average_position: number;
}

export interface CommentWithFrequency {
  text: string;
  count: number;
  percentage: number;
  is_representative: boolean;
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
  iso_5495?: {
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
  statistical_approval_recommended?: boolean;
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
  generated_at: string;
  generated_by?: string;
  insights?: string[];
}

export interface DashboardOverview {
  total_surveys: number;
  total_responses: number;
  recent_surveys: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
  survey_stats: Array<{
    id: string;
    title: string;
    response_count: number;
    last_response: string | null;
  }>;
  generated_at: string;
}
