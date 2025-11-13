import { Survey, SurveyResponse } from '../models/Survey';
export interface ExcelImportResult {
    survey: Survey;
    responses: SurveyResponse[];
}
export declare class ExcelProcessor {
    /**
     * Process an Excel file and extract survey data
     */
    static processExcelFile(buffer: Buffer, filename: string): Promise<ExcelImportResult>;
    /**
     * Process CSV file
     */
    static processCSVFile(buffer: Buffer, filename: string): Promise<ExcelImportResult>;
    /**
     * Create survey structure from Excel headers
     */
    private static createSurveyFromHeaders;
    /**
     * Create responses from data rows
     */
    private static createResponsesFromData;
    /**
     * Extract title from filename
     */
    private static extractTitleFromFilename;
    /**
     * Infer question type from question text
     */
    private static inferQuestionType;
    /**
     * Validate Excel/CSV file format
     */
    static validateFile(buffer: Buffer, mimetype: string): boolean;
}
//# sourceMappingURL=excelProcessor.d.ts.map