"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
/**
 * @route GET /api/reports/survey/:survey_id
 * @desc Generate report for a specific survey
 * @access Private (would need authentication in production)
 */
router.get('/survey/:survey_id', report_controller_1.ReportController.generateReport);
/**
 * @route GET /api/reports/dashboard
 * @desc Get dashboard overview with statistics
 * @access Private (would need authentication in production)
 */
router.get('/dashboard', report_controller_1.ReportController.getDashboardOverview);
exports.default = router;
//# sourceMappingURL=report.routes.js.map