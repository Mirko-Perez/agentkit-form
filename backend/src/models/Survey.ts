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
  responses: Record<string, any>; // question_id -> answer
  respondent_email?: string;
  respondent_name?: string;
  submitted_at: Date;
  metadata?: Record<string, any>; // Additional metadata from AgentKit
}

// New interfaces for sensory evaluation
export interface SensoryProduct {
  id: string;
  name: string;
  code?: string; // e.g., "Fritz", "Osole", "Kiero"
  description?: string;
  image_url?: string;
}

export interface SensoryPreference {
  product_id: string;
  position: 1 | 2 | 3; // 1st, 2nd, 3rd place
  reason?: string; // Optional comment
}

export interface SensoryEvaluation {
  id: string;
  survey_id: string;
  panelist_id: string;
  panelist_name?: string;
  panelist_email?: string;
  preferences: SensoryPreference[]; // Array of 3 preferences
  submitted_at: Date;
  metadata?: Record<string, any>;
}

export interface SensoryResults {
  total_panelists: number;
  products: SensoryProduct[];
  preferences_summary: {
    product_id: string;
    product_name: string;
    first_place: number;
    second_place: number;
    third_place: number;
    total_votes: number;
    percentage: number;
  }[];
  statistical_analysis?: {
    friedman_test?: {
      chi_square: number;
      df: number;
      p_value: number;
      significant: boolean;
      critical_value?: number;
    };
    pairwise_comparisons?: {
      product_a: string;
      product_b: string;
      significant: boolean;
      p_value: number;
    }[];
  };
  generated_at: Date;
}
