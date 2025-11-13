import * as XLSX from 'xlsx';
import { Survey, SurveyResponse, SurveyQuestion } from '../models/Survey';

export interface ExcelImportResult {
  survey: Survey;
  responses: SurveyResponse[];
}

export class ExcelProcessor {
  /**
   * Process an Excel file and extract survey data
   */
  static async processExcelFile(buffer: Buffer, filename: string): Promise<ExcelImportResult> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      // First row is headers/questions
      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);

      // Create survey structure
      const survey = this.createSurveyFromHeaders(headers, filename);

      // Create responses
      const responses = this.createResponsesFromData(survey.id, headers, dataRows);

      return { survey, responses };
    } catch (error) {
      console.error('Error processing Excel file:', error);
      throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process CSV file
   */
  static async processCSVFile(buffer: Buffer, filename: string): Promise<ExcelImportResult> {
    try {
      const csvText = buffer.toString('utf-8');
      const workbook = XLSX.read(csvText, { type: 'string' });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);

      const survey = this.createSurveyFromHeaders(headers, filename);
      const responses = this.createResponsesFromData(survey.id, headers, dataRows);

      return { survey, responses };
    } catch (error) {
      console.error('Error processing CSV file:', error);
      throw new Error(`Failed to process CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create survey structure from Excel headers
   */
  private static createSurveyFromHeaders(headers: string[], filename: string): Survey {
    const surveyId = `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const surveyTitle = this.extractTitleFromFilename(filename);

    // Create questions from headers
    const questions: SurveyQuestion[] = headers.map((header, index) => {
      const questionId = `q${index + 1}`;
      const questionText = header.toString().trim();

      // Try to infer question type from the data pattern
      const type = this.inferQuestionType(questionText);

      return {
        id: questionId,
        type,
        question: questionText,
        required: false // Default to not required
      };
    });

    return {
      id: surveyId,
      title: surveyTitle,
      description: `Imported from ${filename}`,
      questions,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true
    };
  }

  /**
   * Create responses from data rows
   */
  private static createResponsesFromData(
    surveyId: string,
    headers: string[],
    dataRows: any[][]
  ): SurveyResponse[] {
    return dataRows.map((row, index) => {
      const responseId = `response_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;

      // Map row data to question responses
      const responses: Record<string, any> = {};
      headers.forEach((header, colIndex) => {
        const questionId = `q${colIndex + 1}`;
        const value = row[colIndex];

        if (value !== undefined && value !== null && value !== '') {
          responses[questionId] = value;
        }
      });

      return {
        id: responseId,
        survey_id: surveyId,
        responses,
        submitted_at: new Date()
      };
    }).filter(response => Object.keys(response.responses).length > 0); // Filter out empty responses
  }

  /**
   * Extract title from filename
   */
  private static extractTitleFromFilename(filename: string): string {
    // Remove extension and clean up the name
    const nameWithoutExt = filename.replace(/\.(xlsx?|csv)$/i, '');
    // Replace underscores and hyphens with spaces
    return nameWithoutExt.replace(/[_-]/g, ' ').trim();
  }

  /**
   * Infer question type from question text
   */
  private static inferQuestionType(questionText: string): SurveyQuestion['type'] {
    const text = questionText.toLowerCase();

    // Check for rating patterns
    if (text.includes('rate') || text.includes('rating') || text.includes('scale') ||
        text.includes('1-5') || text.includes('1 to 5')) {
      return 'rating';
    }

    // Check for yes/no patterns
    if (text.includes('yes/no') || text.includes('y/n') ||
        text.includes('true/false') || text.includes('t/f')) {
      return 'yes_no';
    }

    // Check for multiple choice patterns (if contains options in parentheses)
    if (text.includes('(') && (text.includes('/') || text.includes(','))) {
      return 'multiple_choice';
    }

    // Default to text for everything else
    return 'text';
  }

  /**
   * Validate Excel/CSV file format
   */
  static validateFile(buffer: Buffer, mimetype: string): boolean {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      'application/csv'
    ];

    return allowedTypes.includes(mimetype);
  }
}
