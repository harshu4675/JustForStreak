import { getEnv } from '../config/env.js';
import { buildAnswerEvaluationPrompts } from '../prompts/assessmentPrompts.js';
import { requestStructuredJsonFromAi } from './aiService.js';
import { executeCodeAgainstTestCases } from './codeExecutionService.js';
import { parseStructuredJson } from '../utils/jsonParser.js';

function roundToTwo(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

function normalizeCodeForComparison(code) {
  return String(code || '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCandidateEntry(rawEntry) {
  if (rawEntry === undefined || rawEntry === null) {
    return { value: null, issueNotes: '' };
  }
  if (
    typeof rawEntry === 'object' &&
    !Array.isArray(rawEntry) &&
    ('value' in rawEntry || 'code' in rawEntry || 'answer' in rawEntry)
  ) {
    const val = rawEntry.value ?? rawEntry.code ?? rawEntry.answer ?? null;
    const issueNotes = typeof rawEntry.issueNotes === 'string' ? rawEntry.issueNotes.trim() : '';
    return { value: val, issueNotes };
  }
  return { value: rawEntry, issueNotes: '' };
}

async function evaluateMcqQuestion(question, rawValue, config) {
  const negativeMarkRatio = config.negativeMarkRatio || 0.25;

  if (question.allowMultiple) {
    const selected = Array.isArray(rawValue)
      ? Array.from(new Set(rawValue.map((v) => String(v).trim().toUpperCase()).filter(Boolean))).sort()
      : [];

    if (selected.length === 0) {
      return {
        userResponse: [],
        evaluationStatus: 'unanswered',
        marksEarned: 0,
        negativePenalty: 0,
        feedback: 'Question was left unanswered.',
      };
    }

    const expected = Array.isArray(question.correctAnswer)
      ? [...question.correctAnswer].map((v) => String(v).toUpperCase()).sort()
      : [String(question.correctAnswer).toUpperCase()];

    const exactMatch =
      selected.length === expected.length &&
      selected.every((val, idx) => val === expected[idx]);

    if (exactMatch) {
      return {
        userResponse: selected,
        evaluationStatus: 'correct',
        marksEarned: question.marks,
        negativePenalty: 0,
        feedback: 'Selected all correct options.',
      };
    }

    const penalty = config.enableNegativeMarking
      ? roundToTwo(question.marks * negativeMarkRatio)
      : 0;

    return {
      userResponse: selected,
      evaluationStatus: 'incorrect',
      marksEarned: -penalty,
      negativePenalty: penalty,
      feedback:
        penalty > 0
          ? `Incorrect selection. Negative marking penalty of ${penalty} mark(s) applied.`
          : 'Selected option(s) did not match the correct answer.',
    };
  }

  const selectedOption = typeof rawValue === 'string' ? rawValue.trim().toUpperCase() : '';
  if (!selectedOption) {
    return {
      userResponse: null,
      evaluationStatus: 'unanswered',
      marksEarned: 0,
      negativePenalty: 0,
      feedback: 'Question was left unanswered.',
    };
  }

  const expectedOption = String(question.correctAnswer || '').trim().toUpperCase();
  if (selectedOption === expectedOption) {
    return {
      userResponse: selectedOption,
      evaluationStatus: 'correct',
      marksEarned: question.marks,
      negativePenalty: 0,
      feedback: 'Correct answer selected.',
    };
  }

  const penalty = config.enableNegativeMarking
    ? roundToTwo(question.marks * negativeMarkRatio)
    : 0;

  return {
    userResponse: selectedOption,
    evaluationStatus: 'incorrect',
    marksEarned: -penalty,
    negativePenalty: penalty,
    feedback:
      penalty > 0
        ? `Incorrect option selected. Negative marking penalty of ${penalty} mark(s) applied.`
        : 'Incorrect option selected.',
  };
}

async function evaluateConceptualQuestion(question, rawValue, assessment) {
  const answerText = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!answerText) {
    return {
      userResponse: '',
      evaluationStatus: 'unanswered',
      marksEarned: 0,
      negativePenalty: 0,
      feedback: 'Question was left unanswered.',
    };
  }

  // Try backend AI rubric grading when configured
  const env = getEnv();
  if (env.isAiConfigured || process.env.NODE_ENV === 'test') {
    try {
      const { systemPrompt, userPrompt } = buildAnswerEvaluationPrompts({
        question,
        userResponse: answerText,
        issueNotes: '',
        subject: assessment.subject,
        programmingLanguage: assessment.programmingLanguage,
      });

      const rawEval = await requestStructuredJsonFromAi({
        systemPrompt,
        userPrompt,
        temperature: 0.1,
      });
      const parsed = parseStructuredJson(rawEval);

      const clampedMarks = roundToTwo(
        Math.min(question.marks, Math.max(0, Number(parsed.marksEarned) || 0))
      );
      const status =
        clampedMarks >= question.marks
          ? 'correct'
          : clampedMarks > 0
            ? 'partial'
            : 'incorrect';

      return {
        userResponse: answerText,
        evaluationStatus: status,
        marksEarned: clampedMarks,
        negativePenalty: 0,
        feedback: String(parsed.feedback || 'Evaluated against expected conceptual rubric.'),
      };
    } catch {
      // Fall back to deterministic rubric evaluation if AI grading fails at submission time
    }
  }

  return evaluateConceptualDeterministically(question, answerText);
}

function evaluateConceptualDeterministically(question, answerText) {
  const lowerAnswer = answerText.toLowerCase();
  const keyPoints = Array.isArray(question.expectedKeyPoints) ? question.expectedKeyPoints : [];

  if (keyPoints.length === 0) {
    return {
      userResponse: answerText,
      evaluationStatus: 'partial',
      marksEarned: roundToTwo(question.marks * 0.5),
      negativePenalty: 0,
      feedback: 'Evaluated using baseline conceptual rubric; review the reference answer for full details.',
    };
  }

  let matchedPoints = 0;
  keyPoints.forEach((point) => {
    const significantTokens = String(point)
      .toLowerCase()
      .split(/[^a-z0-9+#]+/)
      .filter((tok) => tok.length >= 4);

    if (significantTokens.length === 0) return;
    const hitCount = significantTokens.filter((tok) => lowerAnswer.includes(tok)).length;
    if (hitCount / significantTokens.length >= 0.5) {
      matchedPoints += 1;
    }
  });

  const ratio = matchedPoints / keyPoints.length;
  const marksEarned = roundToTwo(question.marks * ratio);
  const evaluationStatus =
    ratio >= 0.85 ? 'correct' : ratio >= 0.3 ? 'partial' : 'incorrect';

  return {
    userResponse: answerText,
    evaluationStatus,
    marksEarned,
    negativePenalty: 0,
    feedback: `Rubric keyword evaluation matched ${matchedPoints} of ${keyPoints.length} expected key concepts.`,
  };
}

async function evaluateDebuggingQuestion(question, rawValue, issueNotes, assessment) {
  const submittedFix = typeof rawValue === 'string' ? rawValue.trim() : '';
  const normalizedSubmitted = normalizeCodeForComparison(submittedFix);
  const normalizedBuggy = normalizeCodeForComparison(question.buggyCode);

  if (!submittedFix || (normalizedSubmitted === normalizedBuggy && !issueNotes)) {
    return {
      userResponse: submittedFix,
      issueNotes,
      evaluationStatus: 'unanswered',
      marksEarned: 0,
      negativePenalty: 0,
      feedback: 'Buggy snippet was not modified and no root-cause notes were submitted.',
    };
  }

  const normalizedCorrected = normalizeCodeForComparison(question.correctedSolution);
  if (normalizedSubmitted && normalizedSubmitted === normalizedCorrected) {
    return {
      userResponse: submittedFix,
      issueNotes,
      evaluationStatus: 'correct',
      marksEarned: question.marks,
      negativePenalty: 0,
      feedback: 'Submitted fix matches the reference corrected solution.',
    };
  }

  const env = getEnv();
  if (env.isAiConfigured || process.env.NODE_ENV === 'test') {
    try {
      const { systemPrompt, userPrompt } = buildAnswerEvaluationPrompts({
        question,
        userResponse: submittedFix,
        issueNotes,
        subject: assessment.subject,
        programmingLanguage: assessment.programmingLanguage,
      });

      const rawEval = await requestStructuredJsonFromAi({
        systemPrompt,
        userPrompt,
        temperature: 0.1,
      });
      const parsed = parseStructuredJson(rawEval);
      const clampedMarks = roundToTwo(
        Math.min(question.marks, Math.max(0, Number(parsed.marksEarned) || 0))
      );
      const status =
        clampedMarks >= question.marks
          ? 'correct'
          : clampedMarks > 0
            ? 'partial'
            : 'incorrect';

      return {
        userResponse: submittedFix,
        issueNotes,
        evaluationStatus: status,
        marksEarned: clampedMarks,
        negativePenalty: 0,
        feedback: String(parsed.feedback || 'Evaluated against debugging solution rubric.'),
      };
    } catch {
      // Fall back to deterministic token comparison
    }
  }

  // Deterministic diff comparison fallback
  const targetTokens = normalizedCorrected
    .split(/[^a-zA-Z0-9_!=<>+-]+/)
    .filter((t) => t.length >= 2);
  const submittedTokens = new Set(
    normalizedSubmitted.split(/[^a-zA-Z0-9_!=<>+-]+/).filter(Boolean)
  );
  const hits = targetTokens.filter((t) => submittedTokens.has(t)).length;
  const similarity = targetTokens.length > 0 ? hits / targetTokens.length : 0;

  if (similarity >= 0.9 && normalizedSubmitted !== normalizedBuggy) {
    return {
      userResponse: submittedFix,
      issueNotes,
      evaluationStatus: 'partial',
      marksEarned: roundToTwo(question.marks * 0.75),
      negativePenalty: 0,
      feedback: 'Code modifications closely align with the reference fix; compare exact edge cases in the corrected solution.',
    };
  }

  return {
    userResponse: submittedFix,
    issueNotes,
    evaluationStatus: 'incorrect',
    marksEarned: 0,
    negativePenalty: 0,
    feedback: 'Submitted modifications did not resolve the identified defect.',
  };
}

async function evaluateCodingQuestion(question, rawValue, assessment) {
  const submittedCode = typeof rawValue === 'string' ? rawValue : '';
  const trimmedCode = submittedCode.trim();
  const normalizedSubmitted = normalizeCodeForComparison(trimmedCode);
  const normalizedStarter = normalizeCodeForComparison(question.starterCode);

  if (!trimmedCode || (normalizedStarter && normalizedSubmitted === normalizedStarter)) {
    return {
      userResponse: submittedCode,
      evaluationStatus: 'unanswered',
      marksEarned: 0,
      negativePenalty: 0,
      feedback: 'No solution code was written beyond the starter template.',
      executionAvailable: false,
      testCasesPassed: null,
      testCasesFailed: null,
      testCaseResults: [],
    };
  }

  const execOutcome = await executeCodeAgainstTestCases({
    code: submittedCode,
    language: assessment.programmingLanguage || assessment.subject,
    testCases: question.testCases || [],
  });

  if (!execOutcome.executionAvailable) {
    return {
      userResponse: submittedCode,
      evaluationStatus: 'execution_unavailable',
      marksEarned: 0,
      negativePenalty: 0,
      feedback: execOutcome.message,
      executionAvailable: false,
      testCasesPassed: null,
      testCasesFailed: null,
      testCaseResults: [],
    };
  }

  const totalCases = (question.testCases || []).length;
  const passed = execOutcome.passedCount || 0;
  const failed = execOutcome.failedCount || 0;
  const ratio = totalCases > 0 ? passed / totalCases : 0;
  const marksEarned = roundToTwo(question.marks * ratio);

  const evaluationStatus =
    passed === totalCases && totalCases > 0
      ? 'correct'
      : passed > 0
        ? 'partial'
        : 'incorrect';

  return {
    userResponse: submittedCode,
    evaluationStatus,
    marksEarned,
    negativePenalty: 0,
    feedback: `Passed ${passed} of ${totalCases} automated sandbox test cases.`,
    executionAvailable: true,
    testCasesPassed: passed,
    testCasesFailed: failed,
    testCaseResults: execOutcome.results,
  };
}

function buildBreakdown(evaluatedAnswers, keyField) {
  const groups = new Map();

  evaluatedAnswers.forEach((item) => {
    const label = item[keyField] || 'General';
    if (!groups.has(label)) {
      groups.set(label, {
        label,
        earnedMarks: 0,
        maxMarks: 0,
        correctCount: 0,
        questionCount: 0,
      });
    }
    const bucket = groups.get(label);
    bucket.earnedMarks += item.marksEarned;
    bucket.maxMarks += item.maxMarks;
    bucket.questionCount += 1;
    if (item.evaluationStatus === 'correct') {
      bucket.correctCount += 1;
    }
  });

  return Array.from(groups.values()).map((bucket) => {
    const clampedEarned = Math.max(0, roundToTwo(bucket.earnedMarks));
    const percentage =
      bucket.maxMarks > 0 ? roundToTwo((clampedEarned / bucket.maxMarks) * 100) : 0;
    return {
      label: bucket.label,
      earnedMarks: roundToTwo(bucket.earnedMarks),
      maxMarks: bucket.maxMarks,
      percentage,
      correctCount: bucket.correctCount,
      questionCount: bucket.questionCount,
    };
  });
}

function buildPerformanceSummary({ percentage, unexecutedCodingCount, topicPerformance, skillLevel }) {
  const weakestTopic = [...topicPerformance].sort((a, b) => a.percentage - b.percentage)[0];
  const strongestTopic = [...topicPerformance].sort((a, b) => b.percentage - a.percentage)[0];

  let headline;
  if (percentage >= 85) {
    headline = `Strong mastery demonstrated at the ${skillLevel} level (${percentage}%).`;
  } else if (percentage >= 65) {
    headline = `Solid working proficiency at the ${skillLevel} level (${percentage}%), with specific areas available for refinement.`;
  } else if (percentage >= 40) {
    headline = `Developing understanding at the ${skillLevel} level (${percentage}%). Reviewing missed explanations will strengthen core concepts.`;
  } else {
    headline = `Foundational gaps identified for the ${skillLevel} level (${percentage}%). Consider reviewing explanations carefully or practicing at an earlier skill tier.`;
  }

  const notes = [headline];
  if (strongestTopic && topicPerformance.length > 1) {
    notes.push(`Highest accuracy was recorded in ${strongestTopic.label} (${strongestTopic.percentage}%).`);
  }
  if (weakestTopic && weakestTopic.percentage < 70) {
    notes.push(`Focus follow-up practice on ${weakestTopic.label} (${weakestTopic.percentage}%).`);
  }
  if (unexecutedCodingCount > 0) {
    notes.push(
      `${unexecutedCodingCount} coding response(s) could not be automatically executed because no sandbox execution service (CODE_EXECUTION_URL) is configured.`
    );
  }
  return notes.join(' ');
}

export async function evaluateAssessmentSubmission({
  assessment,
  rawAnswers = {},
  timeTaken = 0,
  submissionStatus = 'completed',
}) {
  const evaluatedAnswers = [];
  const submittedCode = [];

  let rawScore = 0;
  let maximumScore = 0;
  let scorableMaximumScore = 0;
  let correctCount = 0;
  let partialCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let unexecutedCodingCount = 0;
  let negativeMarksDeducted = 0;

  for (const question of assessment.questions) {
    const { value, issueNotes } = extractCandidateEntry(rawAnswers[question.questionId]);
    maximumScore += question.marks;

    let outcome;
    if (question.type === 'mcq') {
      outcome = await evaluateMcqQuestion(question, value, assessment.configuration || {});
    } else if (question.type === 'conceptual') {
      outcome = await evaluateConceptualQuestion(question, value, assessment);
    } else if (question.type === 'debugging') {
      outcome = await evaluateDebuggingQuestion(question, value, issueNotes, assessment);
    } else if (question.type === 'coding') {
      outcome = await evaluateCodingQuestion(question, value, assessment);
      if (typeof value === 'string' && value.trim()) {
        submittedCode.push({
          questionId: question.questionId,
          language: assessment.programmingLanguage || assessment.subject,
          code: value,
          executionAvailable: Boolean(outcome.executionAvailable),
        });
      }
    }

    if (outcome.evaluationStatus !== 'execution_unavailable') {
      scorableMaximumScore += question.marks;
    }

    rawScore += outcome.marksEarned;
    negativeMarksDeducted += outcome.negativePenalty || 0;

    if (outcome.evaluationStatus === 'correct') correctCount += 1;
    else if (outcome.evaluationStatus === 'partial') partialCount += 1;
    else if (outcome.evaluationStatus === 'incorrect') incorrectCount += 1;
    else if (outcome.evaluationStatus === 'unanswered') unansweredCount += 1;
    else if (outcome.evaluationStatus === 'execution_unavailable') unexecutedCodingCount += 1;

    evaluatedAnswers.push({
      questionId: question.questionId,
      questionType: question.type,
      topic: question.topic,
      difficulty: question.difficulty,
      userResponse: outcome.userResponse,
      issueNotes: outcome.issueNotes || issueNotes || '',
      evaluationStatus: outcome.evaluationStatus,
      marksEarned: roundToTwo(outcome.marksEarned),
      maxMarks: question.marks,
      negativePenalty: roundToTwo(outcome.negativePenalty || 0),
      feedback: outcome.feedback || '',
      executionAvailable: Boolean(outcome.executionAvailable),
      testCasesPassed: outcome.testCasesPassed ?? null,
      testCasesFailed: outcome.testCasesFailed ?? null,
      testCaseResults: outcome.testCaseResults || [],
    });
  }

  const score = Math.max(0, roundToTwo(rawScore));
  const denominator = scorableMaximumScore > 0 ? scorableMaximumScore : maximumScore;
  const percentage =
    denominator > 0 ? roundToTwo(Math.min(100, (score / denominator) * 100)) : 0;

  const topicPerformance = buildBreakdown(evaluatedAnswers, 'topic');
  const difficultyPerformance = buildBreakdown(evaluatedAnswers, 'difficulty');
  const performanceSummary = buildPerformanceSummary({
    percentage,
    unexecutedCodingCount,
    topicPerformance,
    skillLevel: assessment.skillLevel,
  });

  return {
    answers: evaluatedAnswers,
    submittedCode,
    score,
    maximumScore,
    scorableMaximumScore,
    percentage,
    correctCount,
    partialCount,
    incorrectCount,
    unansweredCount,
    unexecutedCodingCount,
    negativeMarksDeducted: roundToTwo(negativeMarksDeducted),
    timeTaken,
    topicPerformance,
    difficultyPerformance,
    performanceSummary,
    submissionStatus,
  };
}
