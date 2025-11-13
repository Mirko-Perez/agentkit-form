import { Request, Response } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
export declare class ImportController {
    /**
     * Import survey data from Excel/CSV file
     */
    static importFromFile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Import from Google Sheets URL
     */
    static importFromGoogleSheets(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get import history
     */
    static getImportHistory(req: Request, res: Response): Promise<void>;
    /**
     * Save imported data to database
     */
    private static saveImportToDatabase;
    /**
     * Extract Google Sheet ID from URL
     */
    private static extractSheetId;
}
//# sourceMappingURL=import.controller.d.ts.map