import { Survey, SurveyResponse, SurveyReport, DashboardOverview, SensoryReport } from '../types/survey';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
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
}

export const apiService = new ApiService();
