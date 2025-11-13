"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const database_1 = require("../config/database");
const excelProcessor_1 = require("../utils/excelProcessor");
const agentKit_1 = require("../utils/agentKit");
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (excelProcessor_1.ExcelProcessor.validateFile(Buffer.alloc(0), file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
        }
    }
});
class ImportController {
    /**
     * Import survey data from Excel/CSV file
     */
    static async importFromFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const file = req.file;
            let importResult;
            // Process based on file type
            if (file.mimetype === 'text/csv' || file.mimetype === 'application/csv') {
                importResult = await excelProcessor_1.ExcelProcessor.processCSVFile(file.buffer, file.originalname);
            }
            else {
                importResult = await excelProcessor_1.ExcelProcessor.processExcelFile(file.buffer, file.originalname);
            }
            // Save to database
            await ImportController.saveImportToDatabase(importResult);
            // Generate initial insights
            const insights = await agentKit_1.AgentKitService.generateSurveyInsights(importResult.survey, importResult.responses, [] // We'll calculate stats after saving
            );
            res.status(201).json({
                message: 'Data imported successfully',
                survey_id: importResult.survey.id,
                imported_responses: importResult.responses.length,
                insights: insights.slice(0, 3) // Return first 3 insights
            });
        }
        catch (error) {
            console.error('Error importing file:', error);
            res.status(500).json({
                error: 'Failed to import file',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * Import from Google Sheets URL
     */
    static async importFromGoogleSheets(req, res) {
        try {
            const { sheetUrl, sheetName } = req.body;
            if (!sheetUrl) {
                return res.status(400).json({ error: 'Google Sheets URL is required' });
            }
            // Extract sheet ID from URL
            const sheetId = ImportController.extractSheetId(sheetUrl);
            if (!sheetId) {
                return res.status(400).json({ error: 'Invalid Google Sheets URL' });
            }
            // For now, return a placeholder response
            // In a real implementation, you would use Google Sheets API
            res.status(200).json({
                message: 'Google Sheets import is not yet implemented',
                sheet_id: sheetId,
                note: 'This feature requires Google Sheets API integration'
            });
        }
        catch (error) {
            console.error('Error importing from Google Sheets:', error);
            res.status(500).json({ error: 'Failed to import from Google Sheets' });
        }
    }
    /**
     * Get import history
     */
    static async getImportHistory(req, res) {
        try {
            const result = await (0, database_1.query)(`
        SELECT
          s.id,
          s.title,
          s.created_at,
          COUNT(sr.id) as response_count
        FROM surveys s
        LEFT JOIN survey_responses sr ON s.id = sr.survey_id
        WHERE s.is_active = true
        GROUP BY s.id, s.title, s.created_at
        ORDER BY s.created_at DESC
        LIMIT 20
      `);
            res.json({
                imports: result.rows,
                total: result.rowCount
            });
        }
        catch (error) {
            console.error('Error fetching import history:', error);
            res.status(500).json({ error: 'Failed to fetch import history' });
        }
    }
    /**
     * Save imported data to database
     */
    static async saveImportToDatabase(importResult) {
        const { survey, responses } = importResult;
        // Insert survey
        await (0, database_1.query)(`INSERT INTO surveys (id, title, description, questions, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            survey.id,
            survey.title,
            survey.description,
            JSON.stringify(survey.questions),
            survey.is_active,
            survey.created_at,
            survey.updated_at
        ]);
        // Insert responses in batches
        const batchSize = 100;
        for (let i = 0; i < responses.length; i += batchSize) {
            const batch = responses.slice(i, i + batchSize);
            for (const response of batch) {
                await (0, database_1.query)(`INSERT INTO survey_responses (id, survey_id, responses, submitted_at)
           VALUES ($1, $2, $3, $4)`, [
                    response.id,
                    response.survey_id,
                    JSON.stringify(response.responses),
                    response.submitted_at
                ]);
            }
        }
    }
    /**
     * Extract Google Sheet ID from URL
     */
    static extractSheetId(url) {
        // Match patterns like:
        // https://docs.google.com/spreadsheets/d/{sheetId}/edit
        // https://docs.google.com/spreadsheets/d/{sheetId}/
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : null;
    }
}
exports.ImportController = ImportController;
//# sourceMappingURL=import.controller.js.map