import { Request, Response } from 'express';
import multer from 'multer';
import { query } from '../config/database';
import { ExcelProcessor, ExcelImportResult } from '../utils/excelProcessor';
import { SensoryProcessor, SensoryImportResult } from '../utils/sensoryProcessor';
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
      const categoryId = req.body.category_id || null; // Get category from form data
      const region = req.body.region || null;
      const country = req.body.country || null;
      const projectName = req.body.project_name || null;
      
      // Process as sensory evaluation (ALL imports are sensory)
      const isCSV = file.mimetype === 'text/csv' || file.mimetype === 'application/csv';
      const sensoryResult = await SensoryProcessor.processSensoryFile(file.buffer, file.originalname, isCSV);

      // Save sensory evaluation to database with category
      await ImportController.saveSensoryToDatabase(sensoryResult, categoryId, region, country, projectName);

      // Generate insights message
      const insights = [
        `Evaluación sensorial importada exitosamente`,
        `${sensoryResult.evaluations.length} panelistas evaluaron ${sensoryResult.products.length} muestras`,
        `ID de evaluación: ${sensoryResult.evaluation_id}`
      ];

      res.status(201).json({
        message: 'Sensory evaluation imported successfully',
        survey_id: sensoryResult.evaluation_id, // Use evaluation_id as survey_id for compatibility
        evaluation_id: sensoryResult.evaluation_id,
        imported_responses: sensoryResult.evaluations.length,
        products: sensoryResult.products.length,
        insights: insights
      });
    } catch (error) {
      console.error('Error importing file:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        error: 'Failed to import file',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
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
   * Save sensory evaluation to database
   */
  private static async saveSensoryToDatabase(
    sensoryResult: SensoryImportResult,
    categoryId?: string | null,
    region?: string | null,
    country?: string | null,
    projectName?: string | null
  ): Promise<void> {
    const { evaluation_id, products, evaluations } = sensoryResult;

    // Insert products
    for (const product of products) {
      await query(
        `INSERT INTO sensory_products (id, evaluation_id, name, code, description, position, is_deleted, region, project_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          product.id,
          product.evaluation_id,
          product.name,
          product.code || null,
          product.description || null,
          product.position,
          false,
          region,
          projectName
        ]
      );
    }

    // Insert evaluations (panelist responses)
    for (const evaluation of evaluations) {
      await query(
        `INSERT INTO sensory_evaluations (
          id, evaluation_id, panelist_id, panelist_name, panelist_email,
          preferences, submitted_at, is_deleted, category_id, region, country, project_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          evaluation.id,
          evaluation.evaluation_id,
          evaluation.panelist_id,
          evaluation.panelist_name || null,
          evaluation.panelist_email || null,
          JSON.stringify(evaluation.preferences),
          evaluation.submitted_at,
          false,
          categoryId,
          region,
          country,
          projectName
        ]
      );
    }
  }

  /**
   * Save imported data to database (Legacy - for backwards compatibility)
   */
  private static async saveImportToDatabase(importResult: ExcelImportResult, categoryId?: string | null): Promise<void> {
    const { survey, responses } = importResult;

    // Insert survey with category
    await query(
      `INSERT INTO surveys (id, title, description, questions, is_active, created_at, updated_at, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        survey.id,
        survey.title,
        survey.description,
        JSON.stringify(survey.questions),
        survey.is_active,
        survey.created_at,
        survey.updated_at,
        categoryId
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
