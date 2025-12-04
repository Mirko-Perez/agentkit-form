import { Survey, SurveyResponse, SurveyReport, DashboardOverview, SensoryReport } from '../types/survey';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const isFormData =
      typeof FormData !== 'undefined' && options?.body instanceof FormData;

    const headers: HeadersInit = {
      ...options?.headers,
    };

    // Only set JSON content-type when we are NOT sending FormData
    if (!isFormData) {
      (headers as any)['Content-Type'] =
        (headers as any)['Content-Type'] || 'application/json';
    }

    // Add authorization token if available
    if (this.token) {
      (headers as any)['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Survey endpoints
  async createSurvey(data: {
    title: string;
    description?: string;
    questions: any[];
  }): Promise<{ survey_id: string }> {
    return this.request('/surveys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSurvey(id: string): Promise<Survey> {
    return this.request(`/surveys/${id}`);
  }

  async submitResponse(surveyId: string, response: SurveyResponse): Promise<{ response_id: string }> {
    return this.request(`/surveys/${surveyId}/responses`, {
      method: 'POST',
      body: JSON.stringify(response),
    });
  }

  // Report endpoints
  async getSurveyReport(surveyId: string): Promise<SurveyReport> {
    return this.request(`/reports/survey/${surveyId}`);
  }

  async getDashboardOverview(): Promise<DashboardOverview> {
    return this.request('/reports/dashboard');
  }

  // Import endpoints
  async importFile(file: File): Promise<{
    survey_id: string;
    imported_responses: number;
    insights: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/import/file', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set content-type for FormData
    });
  }

  async importFromGoogleSheets(sheetUrl: string, sheetName?: string): Promise<any> {
    return this.request('/import/google-sheets', {
      method: 'POST',
      body: JSON.stringify({ sheetUrl, sheetName }),
    });
  }

  async getImportHistory(): Promise<{
    imports: Array<{
      id: string;
      title: string;
      created_at: string;
      response_count: number;
    }>;
    total: number;
  }> {
    return this.request('/import/history');
  }

  // Sensory evaluation endpoints
  async getSensoryReport(evaluationId: string): Promise<SensoryReport> {
    return this.request(`/reports/sensory/${evaluationId}`);
  }

  // Soft delete endpoints
  async softDeleteSurvey(surveyId: string): Promise<{ message: string }> {
    return this.request(`/surveys/${surveyId}`, {
      method: 'DELETE'
    });
  }

  async softDeleteSensoryEvaluation(evaluationId: string): Promise<{ message: string }> {
    return this.request(`/sensory/evaluations/${evaluationId}`, {
      method: 'DELETE'
    });
  }

  async getSensoryEvaluations(): Promise<{
    evaluations: Array<{
      evaluation_id: string;
      total_responses: number;
      total_products: number;
      last_submission: string;
    }>;
    total: number;
  }> {
    return this.request('/sensory/evaluations');
  }

  // Reports planilla endpoints
  async getGeneratedReports(filters?: {
    type?: string;
    region?: string;
    country?: string;
    project_name?: string;
    month?: string;
    year?: string;
    authorization_status?: string;
  }): Promise<{
    reports: Array<any>;
    total: number;
    filters: any;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const queryString = params.toString();
    return this.request(`/reports/generated${queryString ? `?${queryString}` : ''}`);
  }

  async getReportsByMonth(year: number, month: number, filters?: {
    region?: string;
    country?: string;
    project_name?: string;
  }): Promise<{
    reports: Array<any>;
    total: number;
    month: string;
    year: string;
  }> {
    const params = new URLSearchParams({
      year: year.toString(),
      month: month.toString(),
    });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    return this.request(`/reports/by-month?${params.toString()}`);
  }

  async checkWinningFormula(evaluationId: string, threshold: number = 70): Promise<{
    evaluation_id: string;
    winner: {
      product_name: string;
      percentage: number;
      threshold: number;
      meets_threshold: boolean;
    };
    all_products: Array<any>;
    recommendation: string;
  }> {
    return this.request(`/reports/sensory/${evaluationId}/winning-formula?threshold=${threshold}`);
  }

  async authorizeReport(reportId: string, data: {
    authorization_status: 'approved' | 'rejected' | 'pending';
    winning_formula_threshold?: number;
    notes?: string;
    authorized_by?: string;
    report_type?: string;
  }): Promise<{
    message: string;
    report_id: string;
    authorization_status: string;
    winning_formula_threshold: number;
  }> {
    return this.request(`/reports/${reportId}/authorize`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
