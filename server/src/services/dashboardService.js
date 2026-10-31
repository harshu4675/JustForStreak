import { SKILL_LEVELS } from '../utils/catalog.js';

function roundToOne(val) {
  return Math.round((Number(val) + Number.EPSILON) * 10) / 10;
}

export function buildResultPayload(assessment, attempt) {
  const answerMap = new Map(
    (attempt.answers || []).map((ans) => [ans.questionId, ans])
  );

  const detailedReview = (assessment.questions || []).map((q) => {
    const evalItem = answerMap.get(q.questionId) || {
      userResponse: null,
      issueNotes: '',
      evaluationStatus: 'unanswered',
      marksEarned: 0,
      maxMarks: q.marks,
      negativePenalty: 0,
      feedback: 'No answer recorded.',
      executionAvailable: false,
      testCasesPassed: null,
      testCasesFailed: null,
      testCaseResults: [],
    };

    const reviewItem = {
      questionId: q.questionId,
      order: q.order,
      type: q.type,
      difficulty: q.difficulty,
      topic: q.topic,
      questionText: q.questionText,
      marks: q.marks,
      marksEarned: evalItem.marksEarned,
      negativePenalty: evalItem.negativePenalty || 0,
      evaluationStatus: evalItem.evaluationStatus,
      userResponse: evalItem.userResponse,
      issueNotes: evalItem.issueNotes || '',
      feedback: evalItem.feedback,
      explanation: q.explanation,
    };

    if (q.type === 'mcq') {
      reviewItem.options = q.options;
      reviewItem.allowMultiple = q.allowMultiple;
      reviewItem.correctAnswer = q.correctAnswer;
    } else if (q.type === 'coding') {
      reviewItem.problemStatement = q.problemStatement;
      reviewItem.inputFormat = q.inputFormat;
      reviewItem.outputFormat = q.outputFormat;
      reviewItem.exampleInput = q.exampleInput;
      reviewItem.exampleOutput = q.exampleOutput;
      reviewItem.referenceSolution = q.referenceSolution;
      reviewItem.expectedTestCases = (q.testCases || []).map((tc, idx) => ({
        index: idx + 1,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
      }));
      reviewItem.executionAvailable = evalItem.executionAvailable;
      reviewItem.testCasesPassed = evalItem.testCasesPassed;
      reviewItem.testCasesFailed = evalItem.testCasesFailed;
      reviewItem.testCaseResults = evalItem.testCaseResults;
    } else if (q.type === 'debugging') {
      reviewItem.buggyCode = q.buggyCode;
      reviewItem.expectedBehavior = q.expectedBehavior;
      reviewItem.identifiedIssue = q.identifiedIssue;
      reviewItem.correctedSolution = q.correctedSolution;
    } else if (q.type === 'conceptual') {
      reviewItem.expectedKeyPoints = q.expectedKeyPoints;
      reviewItem.correctAnswer = q.sampleAnswer;
    }

    return reviewItem;
  });

  return {
    attemptId: attempt.id,
    assessmentId: assessment.id,
    title: assessment.title,
    subject: assessment.subject,
    programmingLanguage: assessment.programmingLanguage,
    skillLevel: assessment.skillLevel,
    assessmentType: assessment.configuration?.assessmentType,
    enableNegativeMarking: Boolean(assessment.configuration?.enableNegativeMarking),
    score: attempt.score,
    maximumScore: attempt.maximumScore,
    scorableMaximumScore: attempt.scorableMaximumScore,
    percentage: attempt.percentage,
    correctCount: attempt.correctCount,
    partialCount: attempt.partialCount,
    incorrectCount: attempt.incorrectCount,
    unansweredCount: attempt.unansweredCount,
    unexecutedCodingCount: attempt.unexecutedCodingCount,
    negativeMarksDeducted: attempt.negativeMarksDeducted,
    totalQuestions: assessment.questions.length,
    timeTaken: attempt.timeTaken,
    durationMinutes: assessment.duration,
    submissionStatus: attempt.submissionStatus,
    submittedAt: attempt.createdAt,
    performanceSummary: attempt.performanceSummary,
    topicPerformance: attempt.topicPerformance,
    difficultyPerformance: attempt.difficultyPerformance,
    questionsReview: detailedReview,
  };
}

export function computeDashboardData(attemptsWithAssessments) {
  const totalCompleted = attemptsWithAssessments.length;

  if (totalCompleted === 0) {
    return {
      summary: {
        totalAssessmentsCompleted: 0,
        averageScore: 0,
        highestScore: 0,
        subjectsPracticed: 0,
        recentAssessments: [],
        recommendedNextAssessment: {
          subject: 'Programming Fundamentals',
          programmingLanguage: 'Python',
          skillLevel: 'Beginner',
          assessmentType: 'Mixed Assessment',
          reason:
            'Complete your first baseline assessment to unlock personalized skill-level progression and topic recommendations.',
          focusTopics: [],
        },
      },
      progress: {
        subjectProgress: [],
        skillProgression: SKILL_LEVELS.map((lvl) => ({
          skillLevel: lvl.name,
          rank: lvl.rank,
          attemptsCount: 0,
          averagePercentage: 0,
          highestPercentage: 0,
          mastered: false,
        })),
        recentTrend: [],
      },
    };
  }

  const percentages = attemptsWithAssessments.map((item) => item.attempt.percentage);
  const averageScore = roundToOne(
    percentages.reduce((sum, val) => sum + val, 0) / totalCompleted
  );
  const highestScore = roundToOne(Math.max(...percentages));

  const recentAssessments = attemptsWithAssessments.slice(0, 6).map(({ attempt, assessment }) => ({
    attemptId: attempt.id,
    assessmentId: assessment.id,
    title: assessment.title,
    subject: assessment.subject,
    programmingLanguage: assessment.programmingLanguage,
    skillLevel: assessment.skillLevel,
    assessmentType: assessment.configuration?.assessmentType || 'Mixed Assessment',
    score: attempt.score,
    maximumScore: attempt.maximumScore,
    percentage: attempt.percentage,
    timeTaken: attempt.timeTaken,
    completedAt: attempt.createdAt,
  }));

  // Subject-wise aggregation
  const subjectBuckets = new Map();
  attemptsWithAssessments.forEach(({ attempt, assessment }) => {
    const subj = assessment.subject;
    if (!subjectBuckets.has(subj)) {
      subjectBuckets.set(subj, {
        subject: subj,
        attemptsCount: 0,
        totalPercentage: 0,
        highestPercentage: 0,
        highestSkillRank: 0,
        highestSkillLevel: assessment.skillLevel,
        lastAttemptedAt: attempt.createdAt,
      });
    }
    const bucket = subjectBuckets.get(subj);
    bucket.attemptsCount += 1;
    bucket.totalPercentage += attempt.percentage;
    if (attempt.percentage > bucket.highestPercentage) {
      bucket.highestPercentage = attempt.percentage;
    }
    const lvlMeta = SKILL_LEVELS.find((l) => l.name === assessment.skillLevel);
    if (lvlMeta && lvlMeta.rank > bucket.highestSkillRank) {
      bucket.highestSkillRank = lvlMeta.rank;
      bucket.highestSkillLevel = lvlMeta.name;
    }
  });

  const subjectProgress = Array.from(subjectBuckets.values())
    .map((b) => ({
      subject: b.subject,
      attemptsCount: b.attemptsCount,
      averagePercentage: roundToOne(b.totalPercentage / b.attemptsCount),
      highestPercentage: roundToOne(b.highestPercentage),
      highestSkillLevel: b.highestSkillLevel,
      lastAttemptedAt: b.lastAttemptedAt,
    }))
    .sort((a, b) => b.attemptsCount - a.attemptsCount);

  // Skill level progression across all 7 levels
  const skillBuckets = new Map();
  SKILL_LEVELS.forEach((lvl) => {
    skillBuckets.set(lvl.name, {
      skillLevel: lvl.name,
      rank: lvl.rank,
      attemptsCount: 0,
      totalPercentage: 0,
      highestPercentage: 0,
    });
  });

  attemptsWithAssessments.forEach(({ attempt, assessment }) => {
    const bucket = skillBuckets.get(assessment.skillLevel);
    if (bucket) {
      bucket.attemptsCount += 1;
      bucket.totalPercentage += attempt.percentage;
      if (attempt.percentage > bucket.highestPercentage) {
        bucket.highestPercentage = attempt.percentage;
      }
    }
  });

  const skillProgression = Array.from(skillBuckets.values()).map((b) => {
    const avg = b.attemptsCount > 0 ? roundToOne(b.totalPercentage / b.attemptsCount) : 0;
    return {
      skillLevel: b.skillLevel,
      rank: b.rank,
      attemptsCount: b.attemptsCount,
      averagePercentage: avg,
      highestPercentage: roundToOne(b.highestPercentage),
      mastered: b.attemptsCount >= 1 && b.highestPercentage >= 80,
    };
  });

  // Compute recommended next assessment from latest attempt
  const latest = attemptsWithAssessments[0];
  const recommendedNextAssessment = computeRecommendation(latest);

  const recentTrend = [...attemptsWithAssessments]
    .slice(0, 10)
    .reverse()
    .map(({ attempt, assessment }) => ({
      attemptId: attempt.id,
      subject: assessment.subject,
      skillLevel: assessment.skillLevel,
      percentage: attempt.percentage,
      completedAt: attempt.createdAt,
    }));

  return {
    summary: {
      totalAssessmentsCompleted: totalCompleted,
      averageScore,
      highestScore,
      subjectsPracticed: subjectProgress.length,
      recentAssessments,
      recommendedNextAssessment,
    },
    progress: {
      subjectProgress,
      skillProgression,
      recentTrend,
    },
  };
}

function computeRecommendation({ attempt, assessment }) {
  const currentIdx = SKILL_LEVELS.findIndex((l) => l.name === assessment.skillLevel);
  const weakTopics = (attempt.topicPerformance || [])
    .filter((tp) => tp.percentage < 65)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3)
    .map((tp) => tp.label);

  if (attempt.percentage >= 80 && currentIdx !== -1 && currentIdx < SKILL_LEVELS.length - 1) {
    const nextLevel = SKILL_LEVELS[currentIdx + 1].name;
    return {
      subject: assessment.subject,
      programmingLanguage: assessment.programmingLanguage || '',
      skillLevel: nextLevel,
      assessmentType: assessment.configuration?.assessmentType || 'Mixed Assessment',
      focusTopics: [],
      reason: `You scored ${attempt.percentage}% in ${assessment.subject} (${assessment.skillLevel}). Advance to ${nextLevel} to test deeper complexity.`,
    };
  }

  if (attempt.percentage < 50 && currentIdx > 0) {
    const prevLevel = SKILL_LEVELS[currentIdx - 1].name;
    return {
      subject: assessment.subject,
      programmingLanguage: assessment.programmingLanguage || '',
      skillLevel: prevLevel,
      assessmentType: 'Multiple Choice Questions',
      focusTopics: weakTopics,
      reason: `You scored ${attempt.percentage}% in ${assessment.subject} (${assessment.skillLevel}). Reinforce core concepts at ${prevLevel}${weakTopics.length ? ` focusing on ${weakTopics.join(', ')}` : ''}.`,
    };
  }

  return {
    subject: assessment.subject,
    programmingLanguage: assessment.programmingLanguage || '',
    skillLevel: assessment.skillLevel,
    assessmentType: assessment.configuration?.assessmentType || 'Mixed Assessment',
    focusTopics: weakTopics,
    reason:
      weakTopics.length > 0
        ? `Target ${weakTopics.join(', ')} in ${assessment.subject} (${assessment.skillLevel}) to raise your score above 80%.`
        : `Practice another ${assessment.skillLevel} assessment in ${assessment.subject} to reach the 80% advancement threshold.`,
  };
}
