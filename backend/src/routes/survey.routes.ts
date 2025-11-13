import { Router } from 'express';
import { SurveyController } from '../controllers/survey.controller';

const router = Router();

/**
 * @route POST /api/surveys
 * @desc Create a new survey
 * @access Public
 */
router.post('/', SurveyController.createSurvey);

/**
 * @route GET /api/surveys/:id
 * @desc Get survey by ID
 * @access Public
 */
router.get('/:id', SurveyController.getSurvey);

/**
 * @route POST /api/surveys/:survey_id/responses
 * @desc Submit a response to a survey
 * @access Public
 */
router.post('/:survey_id/responses', SurveyController.submitResponse);

/**
 * @route GET /api/surveys/:survey_id/responses
 * @desc Get responses for a survey
 * @access Private (would need authentication in production)
 */
router.get('/:survey_id/responses', SurveyController.getResponses);

/**
 * @route DELETE /api/surveys/:id
 * @desc Soft delete a survey
 * @access Private
 */
router.delete('/:id', SurveyController.softDeleteSurvey);

/**
 * @route DELETE /api/surveys/:survey_id/responses/:response_id
 * @desc Soft delete a survey response
 * @access Private
 */
router.delete('/:survey_id/responses/:response_id', SurveyController.softDeleteResponse);

export default router;
