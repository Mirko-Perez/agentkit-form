"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const survey_controller_1 = require("../controllers/survey.controller");
const router = (0, express_1.Router)();
/**
 * @route POST /api/surveys
 * @desc Create a new survey
 * @access Public
 */
router.post('/', survey_controller_1.SurveyController.createSurvey);
/**
 * @route GET /api/surveys/:id
 * @desc Get survey by ID
 * @access Public
 */
router.get('/:id', survey_controller_1.SurveyController.getSurvey);
/**
 * @route POST /api/surveys/:survey_id/responses
 * @desc Submit a response to a survey
 * @access Public
 */
router.post('/:survey_id/responses', survey_controller_1.SurveyController.submitResponse);
/**
 * @route GET /api/surveys/:survey_id/responses
 * @desc Get responses for a survey
 * @access Private (would need authentication in production)
 */
router.get('/:survey_id/responses', survey_controller_1.SurveyController.getResponses);
exports.default = router;
//# sourceMappingURL=survey.routes.js.map