import { SKILL_LEVEL_NAMES } from '../utils/catalog.js';

const TYPE_MAP = {
  mcq: 'mcq',
  multiple_choice: 'mcq',
  'multiple-choice': 'mcq',
  'multiple choice': 'mcq',
  coding: 'coding',
  code: 'coding',
  debugging: 'debugging',
  debug: 'debugging',
  conceptual: 'conceptual',
  short_answer: 'conceptual',
};

const EXPECTED_SINGLE_TYPE = {
  'Multiple Choice Questions': 'mcq',
  'Coding Questions': 'coding',
  'Debugging Questions': 'debugging',
  'Conceptual Questions': 'conceptual',
};

function normalizeQuestionType(rawType, config) {
  if (EXPECTED_SINGLE_TYPE[config.assessmentType]) {
    return EXPECTED_SINGLE_TYPE[config.assessmentType];
  }
  const key = String(rawType || '').trim().toLowerCase();
  return TYPE_MAP[key] || null;
}

function normalizePromptFingerprint(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeDifficulty(rawDifficulty, fallbackLevel) {
  const cleaned = String(rawDifficulty || '').trim();
  const match = SKILL_LEVEL_NAMES.find(
    (lvl) => lvl.toLowerCase() === cleaned.toLowerCase()
  );
  return match || fallbackLevel;
}

function normalizeOptions(rawOptions) {
  if (!Array.isArray(rawOptions) || rawOptions.length !== 4) {
    return null;
  }

  const optionIds = ['A', 'B', 'C', 'D'];
  const normalized = rawOptions.map((item, idx) => {
    if (typeof item === 'string') {
      const cleaned = item.replace(/^[A-Da-d][).:\-\s]+/, '').trim();
      return { id: optionIds[idx], text: cleaned };
    }
    if (item && typeof item === 'object') {
      const id = optionIds.includes(String(item.id || '').trim().toUpperCase())
        ? String(item.id).trim().toUpperCase()
        : optionIds[idx];
      const text = String(item.text || item.label || item.value || '').trim();
      return { id, text };
    }
    return { id: optionIds[idx], text: '' };
  });

  if (normalized.some((opt) => !opt.text)) {
    return null;
  }

  // Ensure unique option IDs A, B, C, D and distinct option texts
  const uniqueIds = new Set(normalized.map((o) => o.id));
  const uniqueTexts = new Set(normalized.map((o) => o.text.toLowerCase()));
  if (uniqueIds.size !== 4 || uniqueTexts.size < 4) {
    return null;
  }

  return normalized;
}

function resolveMcqCorrectAnswer(rawCorrect, options, allowMultiple) {
  if (allowMultiple && Array.isArray(rawCorrect)) {
    const mapped = rawCorrect
      .map((val) => resolveSingleOptionId(val, options))
      .filter(Boolean);
    return mapped.length > 0 ? Array.from(new Set(mapped)).sort() : null;
  }
  return resolveSingleOptionId(rawCorrect, options);
}

function resolveSingleOptionId(rawVal, options) {
  const str = String(rawVal || '').trim();
  if (!str) return null;
  const upper = str.toUpperCase();
  if (options.some((o) => o.id === upper)) {
    return upper;
  }
  // Match option text if LLM returned the text of the option instead of ID
  const byText = options.find((o) => o.text.toLowerCase() === str.toLowerCase());
  if (byText) return byText.id;
  const prefixMatch = upper.match(/^([A-D])[).:\s]/);
  if (prefixMatch && options.some((o) => o.id === prefixMatch[1])) {
    return prefixMatch[1];
  }
  return null;
}

/**
 * Validates and normalizes AI-generated JSON output against strict domain rules.
 * Returns { valid: true, data } or { valid: false, errors: string[] }.
 */
export function validateAndNormalizeGeneratedAssessment(payload, config) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['Root response must be a JSON object.'] };
  }

  const title = String(
    payload.title || `${config.subject} - ${config.skillLevel} Assessment`
  ).trim();

  if (!title) {
    errors.push('Assessment title is missing.');
  }

  const instructions = Array.isArray(payload.instructions)
    ? payload.instructions.map((item) => String(item || '').trim()).filter(Boolean)
    : typeof payload.instructions === 'string' && payload.instructions.trim()
      ? [payload.instructions.trim()]
      : [
          'Read each question carefully before selecting or writing your response.',
          'Your answers are saved automatically as you navigate between questions.',
          'Review flagged questions before submitting the assessment.',
        ];

  if (!Array.isArray(payload.questions)) {
    return {
      valid: false,
      errors: ['`questions` field must be a JSON array of question objects.'],
    };
  }

  if (payload.questions.length !== config.questionCount) {
    errors.push(
      `Expected ${config.questionCount} questions, but received ${payload.questions.length}.`
    );
  }

  const seenFingerprints = new Set();
  const normalizedQuestions = [];

  payload.questions.forEach((rawQ, idx) => {
    const label = `Question ${idx + 1}`;
    if (!rawQ || typeof rawQ !== 'object') {
      errors.push(`${label}: Must be an object.`);
      return;
    }

    const type = normalizeQuestionType(rawQ.type || rawQ.questionType, config);
    if (!type) {
      errors.push(`${label}: Invalid or unsupported question type "${rawQ.type}".`);
      return;
    }

    const questionText = String(
      rawQ.questionText || rawQ.question || rawQ.prompt || rawQ.problemStatement || ''
    ).trim();

    if (questionText.length < 10) {
      errors.push(`${label}: Question text is missing or too short.`);
      return;
    }

    const fingerprint = normalizePromptFingerprint(questionText);
    if (seenFingerprints.has(fingerprint)) {
      errors.push(`${label}: Duplicate question detected.`);
      return;
    }
    seenFingerprints.add(fingerprint);

    const topic = String(
      rawQ.topic || config.selectedTopics[0] || config.subject
    ).trim();

    const difficulty = normalizeDifficulty(rawQ.difficulty, config.skillLevel);
    const defaultMarks =
      type === 'coding' ? 10 : type === 'debugging' ? 5 : type === 'conceptual' ? 4 : 2;
    const parsedMarks = Number(rawQ.marks);
    const marks =
      Number.isFinite(parsedMarks) && parsedMarks >= 1 && parsedMarks <= 50
        ? Math.round(parsedMarks)
        : defaultMarks;

    const explanation = String(rawQ.explanation || '').trim();
    if (config.includeExplanations && !explanation) {
      errors.push(`${label}: Explanation is required.`);
    }

    const hint = config.includeHints ? String(rawQ.hint || '').trim() : '';

    const normalized = {
      questionId: `q_${idx + 1}`,
      order: idx + 1,
      type,
      difficulty,
      topic,
      marks,
      questionText,
      hint,
      explanation: explanation || 'Refer to the solution details for this topic.',
      options: [],
      allowMultiple: false,
      correctAnswer: null,
      problemStatement: '',
      inputFormat: '',
      outputFormat: '',
      constraints: [],
      exampleInput: '',
      exampleOutput: '',
      starterCode: '',
      referenceSolution: '',
      testCases: [],
      buggyCode: '',
      identifiedIssue: '',
      expectedBehavior: '',
      correctedSolution: '',
      expectedKeyPoints: [],
      sampleAnswer: '',
    };

    if (type === 'mcq') {
      const options = normalizeOptions(rawQ.options);
      if (!options) {
        errors.push(`${label}: Multiple-choice question must have 4 distinct options.`);
        return;
      }
      const allowMultiple = Boolean(rawQ.allowMultiple);
      const correctAnswer = resolveMcqCorrectAnswer(
        rawQ.correctAnswer,
        options,
        allowMultiple
      );
      if (!correctAnswer) {
        errors.push(
          `${label}: Multiple-choice correctAnswer "${rawQ.correctAnswer}" does not match options A, B, C, or D.`
        );
        return;
      }
      normalized.options = options;
      normalized.allowMultiple = allowMultiple;
      normalized.correctAnswer = correctAnswer;
    } else if (type === 'coding') {
      const problemStatement = String(
        rawQ.problemStatement || questionText
      ).trim();
      const inputFormat = String(rawQ.inputFormat || 'Standard input or function arguments as specified.').trim();
      const outputFormat = String(rawQ.outputFormat || 'Return or print the computed result as specified.').trim();
      const constraints = Array.isArray(rawQ.constraints)
        ? rawQ.constraints.map((c) => String(c).trim()).filter(Boolean)
        : typeof rawQ.constraints === 'string' && rawQ.constraints.trim()
          ? [rawQ.constraints.trim()]
          : ['Optimize for correctness and standard time/space bounds.'];
      const exampleInput = String(rawQ.exampleInput ?? '').trim();
      const exampleOutput = String(rawQ.exampleOutput ?? '').trim();
      const starterCode = String(rawQ.starterCode || '').trim();
      const referenceSolution = String(
        rawQ.referenceSolution || rawQ.correctAnswer || ''
      ).trim();

      const rawTestCases = Array.isArray(rawQ.testCases) ? rawQ.testCases : [];
      const testCases = rawTestCases
        .map((tc, tcIdx) => ({
          input: String(tc?.input ?? ''),
          expectedOutput: String(tc?.expectedOutput ?? tc?.output ?? '').trim(),
          isHidden: tcIdx >= 2 ? Boolean(tc?.isHidden ?? true) : Boolean(tc?.isHidden ?? false),
        }))
        .filter((tc) => tc.expectedOutput.length > 0);

      if (!problemStatement || testCases.length === 0) {
        errors.push(
          `${label}: Coding question must include a problemStatement and at least one test case with expectedOutput.`
        );
        return;
      }

      if (!exampleOutput && testCases[0]) {
        normalized.exampleInput = exampleInput || testCases[0].input;
        normalized.exampleOutput = testCases[0].expectedOutput;
      } else {
        normalized.exampleInput = exampleInput;
        normalized.exampleOutput = exampleOutput;
      }

      normalized.problemStatement = problemStatement;
      normalized.inputFormat = inputFormat;
      normalized.outputFormat = outputFormat;
      normalized.constraints = constraints;
      normalized.starterCode = starterCode;
      normalized.referenceSolution = referenceSolution;
      normalized.testCases = testCases;
    } else if (type === 'debugging') {
      const buggyCode = String(rawQ.buggyCode || rawQ.codeSnippet || '').trim();
      const identifiedIssue = String(rawQ.identifiedIssue || '').trim();
      const expectedBehavior = String(rawQ.expectedBehavior || '').trim();
      const correctedSolution = String(
        rawQ.correctedSolution || rawQ.correctAnswer || ''
      ).trim();

      if (!buggyCode || !identifiedIssue || !expectedBehavior || !correctedSolution) {
        errors.push(
          `${label}: Debugging question must include buggyCode, identifiedIssue, expectedBehavior, and correctedSolution.`
        );
        return;
      }

      normalized.buggyCode = buggyCode;
      normalized.identifiedIssue = identifiedIssue;
      normalized.expectedBehavior = expectedBehavior;
      normalized.correctedSolution = correctedSolution;
    } else if (type === 'conceptual') {
      const sampleAnswer = String(
        rawQ.sampleAnswer || rawQ.correctAnswer || ''
      ).trim();
      const expectedKeyPoints = Array.isArray(rawQ.expectedKeyPoints)
        ? rawQ.expectedKeyPoints.map((kp) => String(kp).trim()).filter(Boolean)
        : sampleAnswer
          ? [sampleAnswer]
          : [];

      if (!sampleAnswer || expectedKeyPoints.length === 0) {
        errors.push(
          `${label}: Conceptual question must include sampleAnswer and expectedKeyPoints.`
        );
        return;
      }

      normalized.sampleAnswer = sampleAnswer;
      normalized.expectedKeyPoints = expectedKeyPoints;
      normalized.correctAnswer = sampleAnswer;
    }

    normalizedQuestions.push(normalized);
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      title,
      instructions,
      questions: normalizedQuestions,
    },
  };
}
