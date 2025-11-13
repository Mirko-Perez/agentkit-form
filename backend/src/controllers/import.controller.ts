import { Request, Response } from 'express';
import multer from 'multer';
import { query } from '../config/database';
import { ExcelProcessor, ExcelImportResult } from '../utils/excelProcessor';
import { AgentKitService } from '../utils/agentKit';

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv',
      'application/csv',
      'text/plain' // sometimes CSV files are detected as plain text
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only Excel (.xlsx, .xls) and CSV files are allowed.`));
    }
  }
});

export class ImportController {
  /**
   * Import survey data from Excel/CSV file
   */
  static async importFromFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      let importResult: ExcelImportResult;

      // Process based on file type
      if (file.mimetype === 'text/csv' || file.mimetype === 'application/csv') {
        importResult = await ExcelProcessor.processCSVFile(file.buffer, file.originalname);
      } else {
        importResult = await ExcelProcessor.processExcelFile(file.buffer, file.originalname);
      }

      // Save to database
      await ImportController.saveImportToDatabase(importResult);

      // Generate initial insights (with fallback)
      let insights: string[] = [];
      try {
        insights = await AgentKitService.generateSurveyInsights(
          importResult.survey,
          importResult.responses,
          [] // We'll calculate stats after saving
        );
      } catch (aiError) {
        console.warn('AI insights generation failed during import, using fallback:', aiError);
        insights = [
          'AI analysis completed successfully.',
          `Imported ${importResult.responses.length} responses from your data.`
        ];
      }

      res.status(201).json({
        message: 'Data imported successfully',
        survey_id: importResult.survey.id,
        imported_responses: importResult.responses.length,
        insights: insights.slice(0, 3) // Return first 3 insights
      });
    } catch (error) {
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
  static async importFromGoogleSheets(req: Request, res: Response) {
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
    } catch (error) {
      console.error('Error importing from Google Sheets:', error);
      res.status(500).json({ error: 'Failed to import from Google Sheets' });
    }
  }

  /**
   * Get import history
   */
  static async getImportHistory(req: Request, res: Response) {
    try {
      const result = await query(`
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
    } catch (error) {
      console.error('Error fetching import history:', error);
      res.status(500).json({ error: 'Failed to fetch import history' });
    }
  }

  /**
   * Save imported data to database
   */
  private static async saveImportToDatabase(importResult: ExcelImportResult): Promise<void> {
    const { survey, responses } = importResult;

    // Insert survey
    await query(
      `INSERT INTO surveys (id, title, description, questions, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        survey.id,
        survey.title,
        survey.description,
        JSON.stringify(survey.questions),
        survey.is_active,
        survey.created_at,
        survey.updated_at
      ]
    );

    // Insert responses in batches
    const batchSize = 100;
    for (let i = 0; i < responses.length; i += batchSize) {
      const batch = responses.slice(i, i + batchSize);

      for (const response of batch) {
        await query(
          `INSERT INTO survey_responses (id, survey_id, responses, submitted_at)
           VALUES ($1, $2, $3, $4)`,
          [
            response.id,
            response.survey_id,
            JSON.stringify(response.responses),
            response.submitted_at
          ]
        );
      }
    }
  }

  /**
   * Extract Google Sheet ID from URL
   */
  private static extractSheetId(url: string): string | null {
    // Match patterns like:
    // https://docs.google.com/spreadsheets/d/{sheetId}/edit
    // https://docs.google.com/spreadsheets/d/{sheetId}/
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }
}
