import { Router } from 'express';
import { ImportController, upload } from '../controllers/import.controller';

const router = Router();

/**
 * @route POST /api/import/file
 * @desc Import survey data from Excel/CSV file
 * @access Private
 */
router.post('/file', upload.single('file'), ImportController.importFromFile);

/**
 * @route POST /api/import/google-sheets
 * @desc Import survey data from Google Sheets
 * @access Private
 */
router.post('/google-sheets', ImportController.importFromGoogleSheets);

/**
 * @route GET /api/import/history
 * @desc Get import history
 * @access Private
 */
router.get('/history', ImportController.getImportHistory);

export default router;
