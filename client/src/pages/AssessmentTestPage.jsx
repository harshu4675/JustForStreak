import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Info,
  Send,
  Terminal,
} from 'lucide-react';
import { assessmentService } from '../services/assessmentService.js';
import {
  isQuestionAnswered,
  useAssessmentProgress,
} from '../hooks/useAssessmentProgress.js';
import { useCountdownTimer } from '../hooks/useCountdownTimer.js';
import { AssessmentTimer } from '../components/assessment/AssessmentTimer.jsx';
import { QuestionNavigation } from '../components/assessment/QuestionNavigation.jsx';
import { QuestionCard } from '../components/assessment/QuestionCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';

export function AssessmentTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [capabilities, setCapabilities] = useState({ codeExecutionConfigured: false });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [showInstructions, setShowInstructions] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [expiredNotice, setExpiredNotice] = useState(false);

  const submittingLockRef = useRef(false);

  const fetchAssessment = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await assessmentService.getAssessmentById(id);
      setAssessment(data.assessment);
      if (data.capabilities) {
        setCapabilities(data.capabilities);
      }
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  const progress = useAssessmentProgress(assessment);

  const executeFinalSubmission = useCallback(
    async (submissionStatus = 'completed') => {
      if (!assessment || submittingLockRef.current) return;
      submittingLockRef.current = true;
      setSubmitting(true);
      setSubmitError(null);

      const elapsedSeconds = progress.startedAtMs
        ? Math.max(1, Math.round((Date.now() - progress.startedAtMs) / 1000))
        : 0;

      try {
        const result = await assessmentService.submitAssessment(assessment.id, {
          answers: progress.answers,
          timeTaken: elapsedSeconds,
          submissionStatus,
          submissionKey: progress.submissionKey,
        });

        progress.clearProgress();
        setConfirmOpen(false);
        navigate(
          `/assessments/${assessment.id}/result?attemptId=${encodeURIComponent(result.attemptId)}`,
          { replace: true }
        );
      } catch (err) {
        submittingLockRef.current = false;
        setSubmitting(false);
        setSubmitError(err);
      }
    },
    [assessment, navigate, progress]
  );

  const timerEnabled =
    Boolean(assessment) && assessment.configuration?.enableTimer !== false;

  const remainingSeconds = useCountdownTimer({
    enabled: timerEnabled && progress.isReady && !submitting,
    deadlineMs: progress.deadlineMs,
    onExpire: () => {
      setExpiredNotice(true);
      executeFinalSubmission('expired_auto_submitted');
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState
          title="Preparing assessment workspace"
          description="Loading questions and restoring saved session progress..."
        />
      </div>
    );
  }

  if (loadError || !assessment) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState
          title="Unable to Load Assessment"
          message={loadError?.message || 'Assessment could not be retrieved.'}
          code={loadError?.code}
          onRetry={fetchAssessment}
          secondaryAction={
            <Link
              to="/configure"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Configure New Assessment
            </Link>
          }
        />
      </div>
    );
  }

  const questions = assessment.questions || [];
  const currentQuestion = questions[progress.currentIndex] || questions[0];
  const isFlagged =
    currentQuestion && progress.markedForReview.includes(currentQuestion.questionId);

  const answeredCount = questions.filter((q) =>
    isQuestionAnswered(q, progress.answers[q.questionId])
  ).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = progress.markedForReview.length;

  const handleRunCode = async (codeText) => {
    return assessmentService.runCode(assessment.id, {
      questionId: currentQuestion.questionId,
      code: codeText,
      language: assessment.programmingLanguage || assessment.subject,
    });
  };

  const handleSaveCode = (codeText) => {
    progress.updateAnswer(currentQuestion.questionId, codeText);
    progress.markCodeSaved(currentQuestion.questionId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Assessment Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-900 text-white">
              <Terminal aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                {assessment.title}
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {assessment.subject}
                {assessment.programmingLanguage
                  ? ` · ${assessment.programmingLanguage}`
                  : ''}{' '}
                · {assessment.skillLevel} · {assessment.totalMarks} total marks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
            {Array.isArray(assessment.instructions) &&
              assessment.instructions.length > 0 && (
                <button
                  type="button"
                  aria-expanded={showInstructions}
                  onClick={() => setShowInstructions((prev) => !prev)}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Info aria-hidden="true" className="h-3.5 w-3.5 text-slate-500" />
                  Instructions
                </button>
              )}

            <AssessmentTimer
              enabled={timerEnabled}
              remainingSeconds={remainingSeconds}
            />

            <Button
              variant="accent"
              size="md"
              disabled={submitting}
              onClick={() => setConfirmOpen(true)}
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Submit Assessment</span>
              <span className="sm:hidden">Submit</span>
            </Button>
          </div>
        </div>

        {showInstructions && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">Assessment Instructions:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {assessment.instructions.map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </header>

      {/* Main Test Workspace */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-4">
        {expiredNotice && (
          <div
            role="alert"
            className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-center gap-3 text-xs sm:text-sm text-amber-950"
          >
            <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-700 shrink-0" />
            <span>
              Time has expired. Submitting your recorded responses for evaluation...
            </span>
          </div>
        )}

        {submitError && (
          <ErrorState
            title="Submission Failed"
            message={submitError.message}
            code={submitError.code}
            onRetry={() => executeFinalSubmission('completed')}
            retryLabel="Retry Submission"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Active Question Area */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4 order-2 lg:order-1">
            <QuestionCard
              question={currentQuestion}
              questionNumber={progress.currentIndex + 1}
              totalQuestions={questions.length}
              answer={progress.answers[currentQuestion.questionId]}
              onChangeAnswer={(val) =>
                progress.updateAnswer(currentQuestion.questionId, val)
              }
              programmingLanguage={assessment.programmingLanguage}
              enableNegativeMarking={Boolean(
                assessment.configuration?.enableNegativeMarking
              )}
              codeExecutionConfigured={Boolean(capabilities.codeExecutionConfigured)}
              onRunCode={currentQuestion.type === 'coding' ? handleRunCode : undefined}
              onSaveCode={currentQuestion.type === 'coding' ? handleSaveCode : undefined}
              savedTimestamp={progress.codeSavedAt[currentQuestion.questionId] || null}
            />

            {/* Question Action Bar */}
            <div className="surface-panel p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  disabled={progress.currentIndex === 0 || submitting}
                  onClick={() =>
                    progress.setCurrentIndex(Math.max(0, progress.currentIndex - 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <Button
                  variant={isFlagged ? 'secondary' : 'ghost'}
                  size="md"
                  disabled={submitting}
                  onClick={() => progress.toggleReviewMark(currentQuestion.questionId)}
                  className={isFlagged ? 'border-amber-400 bg-amber-50 text-amber-900' : ''}
                >
                  <Flag
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 ${isFlagged ? 'text-amber-700' : ''}`}
                  />
                  {isFlagged ? 'Marked for Review' : 'Mark for Review'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {progress.currentIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="md"
                    disabled={submitting}
                    onClick={() =>
                      progress.setCurrentIndex(
                        Math.min(questions.length - 1, progress.currentIndex + 1)
                      )
                    }
                  >
                    Next Question
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="accent"
                    size="md"
                    disabled={submitting}
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Review & Submit
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigator Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 order-1 lg:order-2">
            <QuestionNavigation
              questions={questions}
              currentIndex={progress.currentIndex}
              answers={progress.answers}
              markedForReview={progress.markedForReview}
              onSelectQuestion={(idx) => progress.setCurrentIndex(idx)}
            />
          </aside>
        </div>
      </main>

      {/* Final Submission Confirmation Modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={submitting ? undefined : () => setConfirmOpen(false)}
        title="Confirm Assessment Submission"
        description="Once submitted, your answers will be locked and evaluated immediately."
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              disabled={submitting}
              onClick={() => setConfirmOpen(false)}
            >
              Continue Working
            </Button>
            <Button
              variant="accent"
              size="md"
              loading={submitting}
              onClick={() => executeFinalSubmission('completed')}
            >
              Confirm & Submit
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Answered</p>
              <p className="mt-1 font-mono text-lg font-semibold text-emerald-800">
                {answeredCount}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Unanswered</p>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
                {unansweredCount}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Flagged</p>
              <p className="mt-1 font-mono text-lg font-semibold text-amber-800">
                {flaggedCount}
              </p>
            </div>
          </div>

          {(unansweredCount > 0 || flaggedCount > 0) && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 leading-relaxed">
              {unansweredCount > 0 && (
                <p>
                  You still have <span className="font-semibold">{unansweredCount}</span>{' '}
                  unanswered question(s).
                </p>
              )}
              {flaggedCount > 0 && (
                <p>
                  You have <span className="font-semibold">{flaggedCount}</span>{' '}
                  question(s) marked for review.
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
