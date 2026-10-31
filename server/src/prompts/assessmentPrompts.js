import { getSkillLevelMetadata, getSubjectMetadata } from '../utils/catalog.js';

export function buildAssessmentGenerationPrompts(config, validationFeedback = null) {
  const skillMeta = getSkillLevelMetadata(config.skillLevel);
  const subjectMeta = getSubjectMetadata(config.subject);

  const allowedTypesDescription = (() => {
    if (config.assessmentType === 'Multiple Choice Questions') {
      return 'Every question MUST have "type": "mcq".';
    }
    if (config.assessmentType === 'Coding Questions') {
      return 'Every question MUST have "type": "coding".';
    }
    if (config.assessmentType === 'Debugging Questions') {
      return 'Every question MUST have "type": "debugging".';
    }
    if (config.assessmentType === 'Conceptual Questions') {
      return 'Every question MUST have "type": "conceptual".';
    }
    // Mixed Assessment
    if (subjectMeta && !subjectMeta.supportsCodeQuestions) {
      return 'Distribute questions across "mcq" and "conceptual" types only (do not use coding or debugging for this non-programming subject).';
    }
    return 'Distribute questions across "mcq", "coding", "debugging", and "conceptual" types in a balanced technical mix.';
  })();

  const languageLine = config.programmingLanguage
    ? `Target Programming Language: ${config.programmingLanguage}`
    : 'Target Programming Language: Not applicable / Subject-native';

  const topicsLine =
    config.selectedTopics && config.selectedTopics.length > 0
      ? `Required Focus Topics: ${config.selectedTopics.join(', ')}`
      : `Topics: Cover a diverse cross-section of core topics in ${config.subject}.`;

  const systemPrompt = [
    'You are a senior technical curriculum architect and software engineering examiner.',
    'Generate technically accurate, unambiguous, original assessment questions tailored to the exact requested skill level.',
    'CRITICAL OUTPUT RULE: Return ONLY a single valid JSON object. Do NOT output Markdown code fences, introductory prose, or trailing commentary.',
  ].join(' ');

  const schemaInstruction = `{
  "title": "Concise descriptive assessment title",
  "instructions": [
    "Clear instruction string 1",
    "Clear instruction string 2"
  ],
  "questions": [
    {
      "type": "mcq | coding | debugging | conceptual",
      "difficulty": "${config.skillLevel}",
      "topic": "Specific topic name",
      "marks": 2,
      "questionText": "Full, self-contained question prompt",
      "hint": "${config.includeHints ? 'Concise non-spoiler directional hint' : ''}",
      "explanation": "Thorough technical explanation of why the correct answer or solution works",

      "options": [
        { "id": "A", "text": "Option A text" },
        { "id": "B", "text": "Option B text" },
        { "id": "C", "text": "Option C text" },
        { "id": "D", "text": "Option D text" }
      ],
      "allowMultiple": false,
      "correctAnswer": "A",

      "problemStatement": "For coding type: detailed problem specification",
      "inputFormat": "For coding type: standard input format description",
      "outputFormat": "For coding type: expected standard output format description",
      "constraints": ["1 <= n <= 10^5"],
      "exampleInput": "Sample stdin input",
      "exampleOutput": "Sample stdout output",
      "starterCode": "Runnable starter template in ${config.programmingLanguage || 'the target language'} reading stdin and printing stdout",
      "referenceSolution": "Complete working reference solution",
      "testCases": [
        { "input": "Sample stdin 1", "expectedOutput": "Expected stdout 1", "isHidden": false },
        { "input": "Edge case stdin 2", "expectedOutput": "Expected stdout 2", "isHidden": true }
      ],

      "buggyCode": "For debugging type: realistic code snippet containing a concrete defect",
      "identifiedIssue": "For debugging type: precise description of the root cause",
      "expectedBehavior": "For debugging type: what the corrected code must do",
      "correctedSolution": "For debugging type: fixed code snippet",

      "expectedKeyPoints": ["For conceptual type: key concept 1", "key concept 2"],
      "sampleAnswer": "For conceptual type: complete model answer"
    }
  ]
}`;

  const retrySection = validationFeedback
    ? `\nPREVIOUS ATTEMPT FAILED VALIDATION:\n${validationFeedback}\nFix every listed issue and output strictly valid JSON with exactly ${config.questionCount} questions.`
    : '';

  const userPrompt = `Generate a complete technical assessment with the following specification:

Subject: ${config.subject}
${languageLine}
Skill Level: ${config.skillLevel}
Skill Level Learning Objective: ${skillMeta ? skillMeta.description : ''}
Assessment Format: ${config.assessmentType}
Exact Question Count: ${config.questionCount}
Duration: ${config.durationMinutes} minutes
${topicsLine}
Include Detailed Explanations: ${config.includeExplanations ? 'Yes (required for every question)' : 'Provide brief explanations'}
Include Hints: ${config.includeHints ? 'Yes (include a helpful hint for every question)' : 'No (set hint to empty string)'}

Strict Generation Requirements:
1. ${allowedTypesDescription}
2. Generate EXACTLY ${config.questionCount} distinct questions. Never repeat the same question or trivial variations.
3. Calibrate complexity strictly to "${config.skillLevel}": ${skillMeta ? skillMeta.description : ''}.
4. For "mcq" questions: provide exactly 4 distinct options with ids "A", "B", "C", "D", set "allowMultiple": false, and set "correctAnswer" to the exact single letter ("A", "B", "C", or "D") that is indisputably correct. Verify your answer before finalizing.
5. For "coding" questions: provide clear "problemStatement", "inputFormat", "outputFormat", "constraints", "exampleInput", "exampleOutput", "starterCode", "referenceSolution", and at least 3 "testCases" (first 2 visible with "isHidden": false, remaining with "isHidden": true).
6. For "debugging" questions: provide realistic "buggyCode" in ${config.programmingLanguage || config.subject}, "expectedBehavior", "identifiedIssue", and "correctedSolution".
7. For "conceptual" questions: provide 3-5 "expectedKeyPoints" and a concise, accurate "sampleAnswer".

Required JSON Schema:
${schemaInstruction}${retrySection}`;

  return { systemPrompt, userPrompt };
}

export function buildAnswerEvaluationPrompts({ question, userResponse, issueNotes, subject, programmingLanguage }) {
  const systemPrompt = [
    'You are an objective technical assessment grader.',
    'Evaluate the candidate response strictly against the reference rubric.',
    'Return ONLY valid JSON with fields: "marksEarned" (number), "status" ("correct" | "partial" | "incorrect"), and "feedback" (concise constructive string). Do not wrap in Markdown fences.',
  ].join(' ');

  const rubricBlock =
    question.type === 'debugging'
      ? `Question Type: Debugging (${programmingLanguage || subject})
Buggy Code:
${question.buggyCode}

Expected Behavior: ${question.expectedBehavior}
Identified Root Cause: ${question.identifiedIssue}
Reference Corrected Solution:
${question.correctedSolution}

Candidate Submitted Fixed Code:
${userResponse}

Candidate Root Cause Notes:
${issueNotes || '(Not provided)'}`
      : `Question Type: Conceptual (${subject})
Question: ${question.questionText}
Expected Key Points:
- ${(question.expectedKeyPoints || []).join('\n- ')}
Reference Sample Answer:
${question.sampleAnswer}

Candidate Answer:
${userResponse}`;

  const userPrompt = `Evaluate the following candidate response out of a maximum of ${question.marks} marks.

${rubricBlock}

Grading Rules:
- Award full marks (${question.marks}) and status "correct" if the core solution/concepts are accurate and complete.
- Award partial marks (between 0.5 and ${Math.max(0.5, question.marks - 0.5)}) and status "partial" if partially accurate or missing secondary edge cases/key points.
- Award 0 marks and status "incorrect" if fundamentally wrong or irrelevant.

Return strictly this JSON structure:
{
  "marksEarned": 0,
  "status": "correct | partial | incorrect",
  "feedback": "Specific technical feedback explaining what was accurate and what was missed."
}`;

  return { systemPrompt, userPrompt };
}
