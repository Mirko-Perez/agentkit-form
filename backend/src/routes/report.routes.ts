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
router.get('/sensory/:evaluation_id', ReportController.generateSensoryReport);

/**
 * @route GET /api/reports/generated
 * @desc Get list of generated reports for traceability
 * @access Private
 */
router.get('/generated', ReportController.getGeneratedReports);

export default router;
