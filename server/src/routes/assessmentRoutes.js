import { Router } from 'express';
import {
  generateAssessment,
  getAssessment,
  getAssessmentHistory,
  getAssessmentResult,
  getCatalogAndCapabilities,
  runCodeForQuestion,
  submitAssessment,
} from '../controllers/assessmentController.js';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';
import { createAiGenerationRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import {
  validateAssessmentConfigInput,
  validateAssessmentSubmissionInput,
  validateRunCodeInput,
} from '../validators/assessmentValidators.js';

const router = Router();
const aiRateLimiter = createAiGenerationRateLimiter();

router.get('/meta', getCatalogAndCapabilities);
router.get('/history', requireAuth, getAssessmentHistory);

router.post(
  '/generate',
  optionalAuth,
  aiRateLimiter,
  validateBody(validateAssessmentConfigInput),
  generateAssessment
);

router.get('/:id', optionalAuth, getAssessment);
router.post(
  '/:id/run-code',
  optionalAuth,
  validateBody(validateRunCodeInput),
  runCodeForQuestion
);
router.post(
  '/:id/submit',
  optionalAuth,
  validateBody(validateAssessmentSubmissionInput),
  submitAssessment
);
router.get('/:id/result', optionalAuth, getAssessmentResult);

export default router;
