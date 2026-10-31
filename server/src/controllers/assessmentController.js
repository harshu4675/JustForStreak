import { getEnv } from '../config/env.js';
import { repository } from '../services/repositoryService.js';
import {
  generateStructuredAssessment,
  redactAssessmentForCandidate,
} from '../services/assessmentGenerationService.js';
import { evaluateAssessmentSubmission } from '../services/evaluationService.js';
import { executeCodeAgainstTestCases } from '../services/codeExecutionService.js';
import { buildResultPayload } from '../services/dashboardService.js';
import {
  ASSESSMENT_TYPES,
  PROGRAMMING_LANGUAGES,
  SKILL_LEVELS,
  SUBJECT_CATALOG,
} from '../utils/catalog.js';
import { resolveGuestId } from '../utils/guestSession.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function assertAssessmentAccess(assessment, req, guestId) {
  if (!assessment) {
    throw new AppError('The requested assessment could not be found.', 404, 'ASSESSMENT_NOT_FOUND');
  }

  if (assessment.user) {
    if (!req.user || String(req.user.id) !== String(assessment.user)) {
      throw new AppError(
        'You do not have permission to access this assessment.',
        403,
        'FORBIDDEN'
      );
    }
    return;
  }

  // Guest-created assessment: verify matching guest session token
  if (assessment.guestSessionId && assessment.guestSessionId !== guestId) {
    throw new AppError(
      'This guest assessment belongs to a different browser session.',
      403,
      'FORBIDDEN'
    );
  }
}

export const getCatalogAndCapabilities = asyncHandler(async (_req, res) => {
  const env = getEnv();
  res.status(200).json({
    success: true,
    data: {
      subjects: SUBJECT_CATALOG,
      skillLevels: SKILL_LEVELS,
      assessmentTypes: ASSESSMENT_TYPES,
      programmingLanguages: PROGRAMMING_LANGUAGES,
      capabilities: {
        aiConfigured: env.isAiConfigured,
        aiProvider: env.aiProvider,
        codeExecutionConfigured: env.isCodeExecutionConfigured,
      },
    },
  });
});

export const generateAssessment = asyncHandler(async (req, res) => {
  const config = req.validatedBody;
  const guestSessionId = req.user ? null : resolveGuestId(req, res);

  const generated = await generateStructuredAssessment(config);

  const saved = await repository.createAssessment({
    ...generated,
    user: req.user ? req.user.id : null,
    guestSessionId,
  });

  res.status(201).json({
    success: true,
    data: {
      assessment: redactAssessmentForCandidate(saved),
      guestSessionId: guestSessionId || undefined,
    },
  });
});

export const getAssessment = asyncHandler(async (req, res) => {
  const guestId = resolveGuestId(req, res);
  const assessment = await repository.findAssessmentById(req.params.id);
  assertAssessmentAccess(assessment, req, guestId);

  const env = getEnv();
  res.status(200).json({
    success: true,
    data: {
      assessment: redactAssessmentForCandidate(assessment),
      capabilities: {
        codeExecutionConfigured: env.isCodeExecutionConfigured,
      },
    },
  });
});

export const runCodeForQuestion = asyncHandler(async (req, res) => {
  const guestId = resolveGuestId(req, res);
  const assessment = await repository.findAssessmentById(req.params.id);
  assertAssessmentAccess(assessment, req, guestId);

  const { questionId, code, language } = req.validatedBody;
  const question = (assessment.questions || []).find((q) => q.questionId === questionId);

  if (!question || question.type !== 'coding') {
    throw new AppError(
      'Specified coding question was not found in this assessment.',
      404,
      'QUESTION_NOT_FOUND'
    );
  }

  // Run only against non-hidden sample test cases during interactive editing
  const visibleCases = (question.testCases || []).filter((tc) => !tc.isHidden);
  const sampleCases = visibleCases.length > 0 ? visibleCases : (question.testCases || []).slice(0, 1);

  const execution = await executeCodeAgainstTestCases({
    code,
    language: language || assessment.programmingLanguage || assessment.subject,
    testCases: sampleCases,
  });

  res.status(200).json({
    success: true,
    data: execution,
  });
});

export const submitAssessment = asyncHandler(async (req, res) => {
  const guestId = resolveGuestId(req, res);
  const assessment = await repository.findAssessmentById(req.params.id);
  assertAssessmentAccess(assessment, req, guestId);

  const { answers, timeTaken, submissionStatus, submissionKey } = req.validatedBody;

  // Idempotency guard against accidental double-clicks or network retries
  if (submissionKey) {
    const existingAttempt = await repository.findAttemptBySubmissionKey(
      assessment.id,
      submissionKey
    );
    if (existingAttempt) {
      return res.status(200).json({
        success: true,
        data: {
          result: buildResultPayload(assessment, existingAttempt),
          duplicatePrevented: true,
        },
      });
    }
  }

  const evaluation = await evaluateAssessmentSubmission({
    assessment,
    rawAnswers: answers,
    timeTaken,
    submissionStatus,
  });

  const attempt = await repository.createAttempt({
    user: req.user ? req.user.id : null,
    guestSessionId: req.user ? null : guestId,
    assessment: assessment.id,
    submissionKey,
    ...evaluation,
  });

  return res.status(201).json({
    success: true,
    data: {
      result: buildResultPayload(assessment, attempt),
    },
  });
});

export const getAssessmentResult = asyncHandler(async (req, res) => {
  const guestId = resolveGuestId(req, res);
  const assessment = await repository.findAssessmentById(req.params.id);
  assertAssessmentAccess(assessment, req, guestId);

  const requestedAttemptId =
    typeof req.query.attemptId === 'string' ? req.query.attemptId.trim() : null;

  let attempt = null;
  if (req.user) {
    attempt = await repository.findLatestAttemptForAssessment(assessment.id, {
      userId: req.user.id,
      attemptId: requestedAttemptId,
    });
  }
  if (!attempt && !assessment.user) {
    attempt = await repository.findLatestAttemptForAssessment(assessment.id, {
      guestSessionId: guestId,
      attemptId: requestedAttemptId,
    });
  }

  if (!attempt) {
    throw new AppError(
      'No submitted attempt was found for this assessment yet. Complete and submit the assessment before viewing results.',
      404,
      'RESULT_NOT_FOUND'
    );
  }

  res.status(200).json({
    success: true,
    data: {
      result: buildResultPayload(assessment, attempt),
    },
  });
});

export const getAssessmentHistory = asyncHandler(async (req, res) => {
  const items = await repository.listUserAttemptsWithAssessments(req.user.id);

  const subjectFilter =
    typeof req.query.subject === 'string' ? req.query.subject.trim() : '';
  const levelFilter =
    typeof req.query.skillLevel === 'string' ? req.query.skillLevel.trim() : '';

  const filtered = items.filter(({ assessment }) => {
    if (subjectFilter && assessment.subject !== subjectFilter) return false;
    if (levelFilter && assessment.skillLevel !== levelFilter) return false;
    return true;
  });

  const history = filtered.map(({ attempt, assessment }) => ({
    attemptId: attempt.id,
    assessmentId: assessment.id,
    title: assessment.title,
    subject: assessment.subject,
    programmingLanguage: assessment.programmingLanguage,
    skillLevel: assessment.skillLevel,
    assessmentType: assessment.configuration?.assessmentType || 'Mixed Assessment',
    questionCount: assessment.questions.length,
    score: attempt.score,
    maximumScore: attempt.maximumScore,
    percentage: attempt.percentage,
    correctCount: attempt.correctCount,
    incorrectCount: attempt.incorrectCount,
    unansweredCount: attempt.unansweredCount,
    timeTaken: attempt.timeTaken,
    submissionStatus: attempt.submissionStatus,
    completedAt: attempt.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      history,
      total: history.length,
    },
  });
});
