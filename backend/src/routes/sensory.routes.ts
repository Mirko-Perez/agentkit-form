import { Router } from 'express';
import { SensoryController } from '../controllers/sensory.controller';

const router = Router();

/**
 * @route GET /api/sensory/evaluations
 * @desc Get sensory evaluations list
 * @access Private
 */
router.get('/evaluations', SensoryController.getEvaluations);

/**
 * @route DELETE /api/sensory/evaluations/:evaluation_id
 * @desc Soft delete sensory evaluation
 * @access Private
 */
router.delete('/evaluations/:evaluation_id', SensoryController.softDeleteEvaluation);

/**
 * @route DELETE /api/sensory/evaluations/:evaluation_id/responses/:response_id
 * @desc Soft delete sensory evaluation response
 * @access Private
 */
router.delete('/evaluations/:evaluation_id/responses/:response_id', SensoryController.softDeleteEvaluationResponse);

export default router;
