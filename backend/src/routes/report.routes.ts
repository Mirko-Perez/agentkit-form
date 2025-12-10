import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';

const router = Router();

/**
 * @route GET /api/reports/survey/:survey_id
 * @desc Generate report for a specific survey
 * @access Private (would need authentication in production)
 */
router.get('/survey/:survey_id', ReportController.generateReport);

/**
 * @route GET /api/reports/dashboard
 * @desc Get dashboard overview with statistics
 * @access Private (would need authentication in production)
 */
router.get('/dashboard', ReportController.getDashboardOverview);

/**
 * @route GET /api/reports/sensory/:evaluation_id
 * @desc Generate sensory evaluation report
 * @access Private
 */
router.get('/sensory/:evaluation_id', (req, res) => ReportController.generateSensoryReport(req, res));

/**
 * @route GET /api/reports/generated
 * @desc Get list of generated reports for traceability (Planilla de Reportes)
 * @query type, region, country, project_name, month, year, authorization_status
 * @access Private
 */
router.get('/generated', ReportController.getGeneratedReports);

/**
 * @route GET /api/reports/by-month
 * @desc Get reports filtered by month and year
 * @query year, month, region, country, project_name
 * @access Private
 */
router.get('/by-month', ReportController.getReportsByMonth);

/**
 * @route GET /api/reports/sensory/:evaluation_id/winning-formula
 * @desc Check if a product meets the winning formula threshold
 * @query threshold (default: 70, can be 80)
 * @access Private
 */
router.get('/sensory/:evaluation_id/winning-formula', ReportController.checkWinningFormula);

/**
 * @route POST /api/reports/:report_id/authorize
 * @desc Authorize (approve/reject) a report
 * @body authorization_status, winning_formula_threshold, notes, authorized_by
 * @access Private (Admin only)
 */
router.post('/:report_id/authorize', ReportController.authorizeReport);

export default router;
