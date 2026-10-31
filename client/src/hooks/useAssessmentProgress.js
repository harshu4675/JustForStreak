import { useCallback, useEffect, useState } from 'react';

function getProgressKey(assessmentId) {
  return `codeassess_progress_${assessmentId}`;
}

export function clearStoredAssessmentProgress(assessmentId) {
  try {
    window.localStorage.removeItem(getProgressKey(assessmentId));
  } catch {
    // Ignore storage errors
  }
}

function buildInitialAnswers(questions = []) {
  const initial = {};
  questions.forEach((q) => {
    if (q.type === 'coding') {
      initial[q.questionId] = q.starterCode || '';
    } else if (q.type === 'debugging') {
      initial[q.questionId] = {
        code: q.buggyCode || '',
        issueNotes: '',
      };
    } else if (q.type === 'mcq' && q.allowMultiple) {
      initial[q.questionId] = [];
    } else {
      initial[q.questionId] = '';
    }
  });
  return initial;
}

export function isQuestionAnswered(question, answerEntry) {
  if (!question || answerEntry === undefined || answerEntry === null) return false;

  if (question.type === 'mcq') {
    if (question.allowMultiple) {
      return Array.isArray(answerEntry) && answerEntry.length > 0;
    }
    return typeof answerEntry === 'string' && answerEntry.trim().length > 0;
  }

  if (question.type === 'conceptual') {
    return typeof answerEntry === 'string' && answerEntry.trim().length > 0;
  }

  if (question.type === 'coding') {
    const code = typeof answerEntry === 'string' ? answerEntry.trim() : '';
    const starter = String(question.starterCode || '').trim();
    return code.length > 0 && code !== starter;
  }

  if (question.type === 'debugging') {
    const code =
      typeof answerEntry === 'object'
        ? String(answerEntry?.code || '').trim()
        : String(answerEntry || '').trim();
    const notes =
      typeof answerEntry === 'object' ? String(answerEntry?.issueNotes || '').trim() : '';
    const buggy = String(question.buggyCode || '').trim();
    return (code.length > 0 && code !== buggy) || notes.length > 0;
  }

  return false;
}

export function useAssessmentProgress(assessment) {
  const [state, setState] = useState({
    initializedForId: null,
    currentIndex: 0,
    answers: {},
    markedForReview: [],
    codeSavedAt: {},
    startedAtMs: null,
    deadlineMs: null,
    submissionKey: '',
  });

  useEffect(() => {
    if (!assessment?.id) return;

    const storageKey = getProgressKey(assessment.id);
    const defaultAnswers = buildInitialAnswers(assessment.questions);
    const now = Date.now();
    const durationMs = (Number(assessment.duration) || 30) * 60 * 1000;
    const enableTimer = assessment.configuration?.enableTimer !== false;

    let restored = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        restored = JSON.parse(raw);
      }
    } catch {
      restored = null;
    }

    if (restored && restored.initializedForId === assessment.id) {
      setState({
        initializedForId: assessment.id,
        currentIndex: Math.min(
          Math.max(0, Number(restored.currentIndex) || 0),
          Math.max(0, assessment.questions.length - 1)
        ),
        answers: { ...defaultAnswers, ...(restored.answers || {}) },
        markedForReview: Array.isArray(restored.markedForReview)
          ? restored.markedForReview
          : [],
        codeSavedAt: restored.codeSavedAt || {},
        startedAtMs: Number(restored.startedAtMs) || now,
        deadlineMs: enableTimer
          ? Number(restored.deadlineMs) || now + durationMs
          : null,
        submissionKey:
          restored.submissionKey || `attempt_${assessment.id}_${now}`,
      });
      return;
    }

    const freshState = {
      initializedForId: assessment.id,
      currentIndex: 0,
      answers: defaultAnswers,
      markedForReview: [],
      codeSavedAt: {},
      startedAtMs: now,
      deadlineMs: enableTimer ? now + durationMs : null,
      submissionKey: `attempt_${assessment.id}_${now}`,
    };

    setState(freshState);
  }, [assessment]);

  useEffect(() => {
    if (!assessment?.id || state.initializedForId !== assessment.id) return;
    try {
      window.localStorage.setItem(
        getProgressKey(assessment.id),
        JSON.stringify(state)
      );
    } catch {
      // Ignore localStorage quota issues
    }
  }, [assessment?.id, state]);

  const setCurrentIndex = useCallback((index) => {
    setState((prev) => ({
      ...prev,
      currentIndex: index,
    }));
  }, []);

  const updateAnswer = useCallback((questionId, value) => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value,
      },
    }));
  }, []);

  const markCodeSaved = useCallback((questionId) => {
    setState((prev) => ({
      ...prev,
      codeSavedAt: {
        ...prev.codeSavedAt,
        [questionId]: new Date().toISOString(),
      },
    }));
  }, []);

  const toggleReviewMark = useCallback((questionId) => {
    setState((prev) => {
      const exists = prev.markedForReview.includes(questionId);
      const next = exists
        ? prev.markedForReview.filter((id) => id !== questionId)
        : [...prev.markedForReview, questionId];
      return {
        ...prev,
        markedForReview: next,
      };
    });
  }, []);

  const clearProgress = useCallback(() => {
    if (assessment?.id) {
      clearStoredAssessmentProgress(assessment.id);
    }
  }, [assessment?.id]);

  return {
    ...state,
    isReady: Boolean(assessment?.id && state.initializedForId === assessment.id),
    setCurrentIndex,
    updateAnswer,
    markCodeSaved,
    toggleReviewMark,
    clearProgress,
  };
}
