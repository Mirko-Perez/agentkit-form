"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const import_controller_1 = require("../controllers/import.controller");
const router = (0, express_1.Router)();
/**
 * @route POST /api/import/file
 * @desc Import survey data from Excel/CSV file
 * @access Private
 */
router.post('/file', import_controller_1.upload.single('file'), import_controller_1.ImportController.importFromFile);
/**
 * @route POST /api/import/google-sheets
 * @desc Import survey data from Google Sheets
 * @access Private
 */
router.post('/google-sheets', import_controller_1.ImportController.importFromGoogleSheets);
/**
 * @route GET /api/import/history
 * @desc Get import history
 * @access Private
 */
router.get('/history', import_controller_1.ImportController.getImportHistory);
exports.default = router;
//# sourceMappingURL=import.routes.js.map