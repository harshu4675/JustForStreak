import { AppError } from '../utils/AppError.js';
import {
  ASSESSMENT_TYPES,
  PROGRAMMING_LANGUAGES,
  SKILL_LEVEL_NAMES,
  getSubjectMetadata,
} from '../utils/catalog.js';

export function validateAssessmentConfigInput(body = {}) {
  const errors = {};

  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const subjectMeta = getSubjectMetadata(subject);

  if (!subjectMeta) {
    errors.subject = 'Please select a valid subject from the supported catalog.';
  }

  const skillLevel = typeof body.skillLevel === 'string' ? body.skillLevel.trim() : '';
  if (!SKILL_LEVEL_NAMES.includes(skillLevel)) {
    errors.skillLevel = 'Please select a valid skill level.';
  }

  const assessmentType =
    typeof body.assessmentType === 'string' ? body.assessmentType.trim() : '';
  if (!ASSESSMENT_TYPES.includes(assessmentType)) {
    errors.assessmentType = 'Please select a valid assessment type.';
  } else if (
    subjectMeta &&
    !subjectMeta.supportsCodeQuestions &&
    (assessmentType === 'Coding Questions' || assessmentType === 'Debugging Questions')
  ) {
    errors.assessmentType = `${assessmentType} are not applicable to ${subject}. Choose Multiple Choice Questions, Conceptual Questions, or Mixed Assessment.`;
  }

  let programmingLanguage =
    typeof body.programmingLanguage === 'string' ? body.programmingLanguage.trim() : '';

  if (subjectMeta) {
    if (subjectMeta.languageMode === 'fixed') {
      programmingLanguage = subjectMeta.defaultLanguage;
    } else if (subjectMeta.languageMode === 'none') {
      programmingLanguage = '';
    } else if (subjectMeta.languageMode === 'required') {
      if (!programmingLanguage) {
        errors.programmingLanguage = `Please select a programming language for ${subject}.`;
      } else if (!subjectMeta.supportedLanguages.includes(programmingLanguage)) {
        errors.programmingLanguage = `Unsupported programming language for ${subject}.`;
      }
    } else if (subjectMeta.languageMode === 'optional') {
      if (programmingLanguage && !PROGRAMMING_LANGUAGES.includes(programmingLanguage)) {
        errors.programmingLanguage = 'Selected programming language is invalid.';
      }
      if (
        !programmingLanguage &&
        (assessmentType === 'Coding Questions' || assessmentType === 'Debugging Questions')
      ) {
        errors.programmingLanguage =
          'Please select a programming language when including coding or debugging questions.';
      }
    }
  }

  const questionCount = Number.parseInt(body.questionCount, 10);
  if (!Number.isFinite(questionCount) || questionCount < 1 || questionCount > 25) {
    errors.questionCount = 'Question count must be an integer between 1 and 25.';
  }

  const durationMinutes = Number.parseInt(body.durationMinutes, 10);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 180) {
    errors.durationMinutes = 'Assessment duration must be between 5 and 180 minutes.';
  }

  let selectedTopics = [];
  if (Array.isArray(body.selectedTopics)) {
    selectedTopics = body.selectedTopics
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter(Boolean)
      .slice(0, 12);
    if (selectedTopics.some((t) => t.length > 80)) {
      errors.selectedTopics = 'Each topic name must be 80 characters or fewer.';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError(
      'Assessment configuration contains invalid fields.',
      400,
      'VALIDATION_ERROR',
      errors
    );
  }

  return {
    subject,
    programmingLanguage,
    skillLevel,
    assessmentType,
    questionCount,
    durationMinutes,
    includeExplanations: body.includeExplanations !== false,
    includeHints: Boolean(body.includeHints),
    enableNegativeMarking: Boolean(body.enableNegativeMarking),
    enableTimer: body.enableTimer !== false,
    randomizeQuestions: Boolean(body.randomizeQuestions),
    selectedTopics,
  };
}

export function validateAssessmentSubmissionInput(body = {}) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Invalid submission payload.', 400, 'VALIDATION_ERROR');
  }

  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const rawTimeTaken = Number(body.timeTaken);
  const timeTaken =
    Number.isFinite(rawTimeTaken) && rawTimeTaken >= 0
      ? Math.min(Math.round(rawTimeTaken), 86400)
      : 0;

  const submissionStatus =
    body.submissionStatus === 'expired_auto_submitted'
      ? 'expired_auto_submitted'
      : 'completed';

  const submissionKey =
    typeof body.submissionKey === 'string' && body.submissionKey.trim().length <= 100
      ? body.submissionKey.trim()
      : null;

  return {
    answers,
    timeTaken,
    submissionStatus,
    submissionKey,
  };
}

export function validateRunCodeInput(body = {}) {
  const questionId = typeof body.questionId === 'string' ? body.questionId.trim() : '';
  const code = typeof body.code === 'string' ? body.code : '';
  const language = typeof body.language === 'string' ? body.language.trim() : '';

  if (!questionId) {
    throw new AppError('questionId is required to run code.', 400, 'VALIDATION_ERROR');
  }
  if (!code.trim()) {
    throw new AppError('Code editor content cannot be empty.', 400, 'VALIDATION_ERROR');
  }
  if (code.length > 50000) {
    throw new AppError('Submitted code exceeds maximum length of 50,000 characters.', 400, 'VALIDATION_ERROR');
  }

  return { questionId, code, language };
}
