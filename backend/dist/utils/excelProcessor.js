"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelProcessor = void 0;
const XLSX = __importStar(require("xlsx"));
class ExcelProcessor {
    /**
     * Process an Excel file and extract survey data
     */
    static async processExcelFile(buffer, filename) {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            // Get the first worksheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
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
        }
        catch (error) {
            console.error('Error processing Excel file:', error);
            throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Process CSV file
     */
    static async processCSVFile(buffer, filename) {
        try {
            const csvText = buffer.toString('utf-8');
            const workbook = XLSX.read(csvText, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (jsonData.length < 2) {
                throw new Error('CSV file must contain at least a header row and one data row');
            }
            const headers = jsonData[0];
            const dataRows = jsonData.slice(1);
            const survey = this.createSurveyFromHeaders(headers, filename);
            const responses = this.createResponsesFromData(survey.id, headers, dataRows);
            return { survey, responses };
        }
        catch (error) {
            console.error('Error processing CSV file:', error);
            throw new Error(`Failed to process CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create survey structure from Excel headers
     */
    static createSurveyFromHeaders(headers, filename) {
        const surveyId = `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const surveyTitle = this.extractTitleFromFilename(filename);
        // Create questions from headers
        const questions = headers.map((header, index) => {
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
    static createResponsesFromData(surveyId, headers, dataRows) {
        return dataRows.map((row, index) => {
            const responseId = `response_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
            // Map row data to question responses
            const responses = {};
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
    static extractTitleFromFilename(filename) {
        // Remove extension and clean up the name
        const nameWithoutExt = filename.replace(/\.(xlsx?|csv)$/i, '');
        // Replace underscores and hyphens with spaces
        return nameWithoutExt.replace(/[_-]/g, ' ').trim();
    }
    /**
     * Infer question type from question text
     */
    static inferQuestionType(questionText) {
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
    static validateFile(buffer, mimetype) {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv',
            'application/csv'
        ];
        return allowedTypes.includes(mimetype);
    }
}
exports.ExcelProcessor = ExcelProcessor;
//# sourceMappingURL=excelProcessor.js.map