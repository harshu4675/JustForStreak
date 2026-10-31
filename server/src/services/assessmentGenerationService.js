import { buildAssessmentGenerationPrompts } from '../prompts/assessmentPrompts.js';
import { requestStructuredJsonFromAi } from './aiService.js';
import { parseStructuredJson } from '../utils/jsonParser.js';
import { validateAndNormalizeGeneratedAssessment } from '../validators/assessmentSchemaValidator.js';
import { AppError } from '../utils/AppError.js';

function shuffleQuestions(questions) {
  const copy = [...questions];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.map((q, index) => ({
    ...q,
    order: index + 1,
  }));
}

/**
 * Generates and strictly validates an assessment using the configured AI provider.
 * Automatically performs one corrective retry if the LLM emits malformed JSON
 * or violates schema requirements. Never substitutes fake questions.
 */
export async function generateStructuredAssessment(config) {
  const maxAttempts = 2;
  let lastValidationFeedback = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { systemPrompt, userPrompt } = buildAssessmentGenerationPrompts(
      config,
      lastValidationFeedback
    );

    const rawText = await requestStructuredJsonFromAi({
      systemPrompt,
      userPrompt,
      temperature: attempt === 1 ? 0.35 : 0.15,
    });

    let parsedJson;
    try {
      parsedJson = parseStructuredJson(rawText);
    } catch (parseErr) {
      lastValidationFeedback = `Output was not valid JSON: ${parseErr.message}`;
      continue;
    }

    const validation = validateAndNormalizeGeneratedAssessment(parsedJson, config);
    if (!validation.valid) {
      lastValidationFeedback = validation.errors.join('\n');
      continue;
    }

    const questions = config.randomizeQuestions
      ? shuffleQuestions(validation.data.questions)
      : validation.data.questions;

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    return {
      title: validation.data.title,
      subject: config.subject,
      programmingLanguage: config.programmingLanguage,
      skillLevel: config.skillLevel,
      instructions: validation.data.instructions,
      duration: config.durationMinutes,
      totalMarks,
      configuration: {
        assessmentType: config.assessmentType,
        questionCount: config.questionCount,
        durationMinutes: config.durationMinutes,
        includeExplanations: config.includeExplanations,
        includeHints: config.includeHints,
        enableNegativeMarking: config.enableNegativeMarking,
        negativeMarkRatio: 0.25,
        enableTimer: config.enableTimer,
        randomizeQuestions: config.randomizeQuestions,
        selectedTopics: config.selectedTopics,
      },
      questions,
    };
  }

  throw new AppError(
    `The AI provider returned an invalid assessment structure after ${maxAttempts} attempts (${lastValidationFeedback || 'schema mismatch'}). Please retry generating the assessment.`,
    502,
    'AI_INVALID_OUTPUT'
  );
}

/**
 * Strips answers, solutions, explanations, and hidden test cases before sending
 * an active assessment to the test-taking client.
 */
export function redactAssessmentForCandidate(assessment) {
  const safeQuestions = (assessment.questions || []).map((q) => {
    const base = {
      questionId: q.questionId,
      order: q.order,
      type: q.type,
      difficulty: q.difficulty,
      topic: q.topic,
      marks: q.marks,
      questionText: q.questionText,
      hint: assessment.configuration?.includeHints ? q.hint : '',
    };

    if (q.type === 'mcq') {
      return {
        ...base,
        options: q.options,
        allowMultiple: q.allowMultiple,
      };
    }

    if (q.type === 'coding') {
      return {
        ...base,
        problemStatement: q.problemStatement,
        inputFormat: q.inputFormat,
        outputFormat: q.outputFormat,
        constraints: q.constraints,
        exampleInput: q.exampleInput,
        exampleOutput: q.exampleOutput,
        starterCode: q.starterCode,
        sampleTestCases: (q.testCases || [])
          .filter((tc) => !tc.isHidden)
          .map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })),
        totalTestCaseCount: (q.testCases || []).length,
      };
    }

    if (q.type === 'debugging') {
      return {
        ...base,
        buggyCode: q.buggyCode,
        expectedBehavior: q.expectedBehavior,
      };
    }

    return base;
  });

  return {
    id: assessment.id,
    title: assessment.title,
    subject: assessment.subject,
    programmingLanguage: assessment.programmingLanguage,
    skillLevel: assessment.skillLevel,
    instructions: assessment.instructions,
    duration: assessment.duration,
    totalMarks: assessment.totalMarks,
    configuration: assessment.configuration,
    questions: safeQuestions,
    createdAt: assessment.createdAt,
  };
}
