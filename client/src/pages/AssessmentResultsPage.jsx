import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  HelpCircle,
  LayoutDashboard,
  MinusCircle,
  Plus,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { assessmentService } from '../services/assessmentService.js';
import { clearStoredAssessmentProgress } from '../hooks/useAssessmentProgress.js';
import { ResultSummary } from '../components/results/ResultSummary.jsx';
import { TopicPerformance } from '../components/results/TopicPerformance.jsx';
import { Button } from '../components/ui/Button.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import {
  formatEvaluationStatusLabel,
  formatQuestionTypeLabel,
} from '../utils/formatters.js';

function getStatusBadgeMeta(status) {
  switch (status) {
    case 'correct':
      return {
        icon: CheckCircle2,
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'partial':
      return {
        icon: HelpCircle,
        classes: 'bg-amber-50 text-amber-900 border-amber-200',
      };
    case 'incorrect':
      return {
        icon: XCircle,
        classes: 'bg-rose-50 text-rose-800 border-rose-200',
      };
    case 'execution_unavailable':
      return {
        icon: AlertCircle,
        classes: 'bg-slate-100 text-slate-800 border-slate-300',
      };
    default:
      return {
        icon: MinusCircle,
        classes: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

export function AssessmentResultsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const reviewSectionRef = useRef(null);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('all');

  const fetchResult = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getAssessmentResult(id, attemptId);
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id, attemptId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const filteredQuestions = useMemo(() => {
    if (!result?.questionsReview) return [];
    if (filterMode === 'incorrect') {
      return result.questionsReview.filter(
        (q) => q.evaluationStatus === 'incorrect' || q.evaluationStatus === 'partial'
      );
    }
    if (filterMode === 'correct') {
      return result.questionsReview.filter((q) => q.evaluationStatus === 'correct');
    }
    if (filterMode === 'unanswered') {
      return result.questionsReview.filter((q) => q.evaluationStatus === 'unanswered');
    }
    return result.questionsReview;
  }, [result, filterMode]);

  if (loading) {
    return (
      <LoadingState
        title="Loading assessment results"
        description="Compiling score summary, topic analytics, and question explanations..."
      />
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState
          title="Results Unavailable"
          message={error?.message || 'Unable to load assessment results.'}
          code={error?.code}
          onRetry={fetchResult}
          secondaryAction={
            <Link
              to={`/assessments/${id}/take`}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Go to Assessment
            </Link>
          }
        />
      </div>
    );
  }

  const handleRetake = () => {
    clearStoredAssessmentProgress(result.assessmentId);
    navigate(`/assessments/${result.assessmentId}/take`);
  };

  const handleReviewIncorrect = () => {
    setFilterMode('incorrect');
    reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Primary Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="primary" size="md" onClick={handleRetake}>
            <RotateCcw className="h-3.5 w-3.5" />
            Retake Assessment
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() =>
              navigate(
                `/configure?subject=${encodeURIComponent(result.subject)}&skillLevel=${encodeURIComponent(result.skillLevel)}`
              )
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Generate Another Assessment
          </Button>
          {result.incorrectCount + (result.partialCount || 0) > 0 && (
            <Button variant="secondary" size="md" onClick={handleReviewIncorrect}>
              <Filter className="h-3.5 w-3.5" />
              Review Incorrect Answers
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="md"
          onClick={() =>
            navigate(isAuthenticated ? '/dashboard' : '/login?redirect=/dashboard')
          }
        >
          <LayoutDashboard className="h-4 w-4" />
          {isAuthenticated ? 'Return to Dashboard' : 'Sign in for Dashboard'}
        </Button>
      </div>

      {/* Executive Score Summary */}
      <ResultSummary result={result} />

      {/* Topic & Difficulty Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopicPerformance
          title="Topic-wise Performance"
          items={result.topicPerformance}
        />
        <TopicPerformance
          title="Difficulty-wise Performance"
          items={result.difficultyPerformance}
        />
      </div>

      {/* Detailed Question Review */}
      <section ref={reviewSectionRef} className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Detailed Question Review
            </h2>
            <p className="text-xs text-slate-600">
              Compare your submitted answers with reference answers and explanations.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter reviewed questions"
            className="flex flex-wrap gap-1.5"
          >
            {[
              { key: 'all', label: `All (${result.questionsReview.length})` },
              {
                key: 'incorrect',
                label: `Incorrect / Partial (${
                  result.incorrectCount + (result.partialCount || 0)
                })`,
              },
              { key: 'correct', label: `Correct (${result.correctCount})` },
              { key: 'unanswered', label: `Unanswered (${result.unansweredCount})` },
            ].map((tab) => {
              const active = filterMode === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilterMode(tab.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="surface-panel p-8 text-center text-sm text-slate-600">
            No questions match the selected filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((item) => {
              const badgeMeta = getStatusBadgeMeta(item.evaluationStatus);
              const StatusIcon = badgeMeta.icon;

              return (
                <article key={item.questionId} className="surface-panel overflow-hidden">
                  <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-slate-900">
                        Q{item.order}
                      </span>
                      <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700">
                        {formatQuestionTypeLabel(item.type)}
                      </span>
                      <span className="rounded bg-slate-200/70 px-2 py-0.5 text-slate-700">
                        {item.topic}
                      </span>
                      <span className="text-slate-500">{item.difficulty}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-0.5 text-xs font-semibold ${badgeMeta.classes}`}
                      >
                        <StatusIcon aria-hidden="true" className="h-3.5 w-3.5" />
                        {formatEvaluationStatusLabel(item.evaluationStatus)}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {item.marksEarned} / {item.marks} marks
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 text-sm">
                    <p className="font-medium text-slate-900 whitespace-pre-line leading-relaxed">
                      {item.questionText}
                    </p>

                    {/* Multiple-Choice Review */}
                    {item.type === 'mcq' && (
                      <div className="space-y-2">
                        {(item.options || []).map((opt) => {
                          const correctIds = Array.isArray(item.correctAnswer)
                            ? item.correctAnswer
                            : [item.correctAnswer];
                          const userIds = Array.isArray(item.userResponse)
                            ? item.userResponse
                            : item.userResponse
                              ? [item.userResponse]
                              : [];

                          const isCorrectOption = correctIds.includes(opt.id);
                          const isUserSelected = userIds.includes(opt.id);

                          let rowStyle = 'border-slate-200 bg-white text-slate-800';
                          if (isCorrectOption) {
                            rowStyle = 'border-emerald-300 bg-emerald-50/70 text-emerald-950';
                          } else if (isUserSelected && !isCorrectOption) {
                            rowStyle = 'border-rose-300 bg-rose-50/70 text-rose-950';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3.5 py-2.5 text-xs sm:text-sm ${rowStyle}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="font-mono text-xs font-semibold">
                                  {opt.id}.
                                </span>
                                <span>{opt.text}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-semibold">
                                {isUserSelected && (
                                  <span className="rounded bg-white/90 border border-current px-2 py-0.5">
                                    Your answer
                                  </span>
                                )}
                                {isCorrectOption && (
                                  <span className="inline-flex items-center gap-1 text-emerald-800">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Correct answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Coding Review */}
                    {item.type === 'coding' && (
                      <div className="space-y-3.5">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                            Submitted Code
                          </h3>
                          <pre className="code-block">
                            {item.userResponse && String(item.userResponse).trim()
                              ? item.userResponse
                              : '// No code submitted'}
                          </pre>
                        </div>

                        {item.executionAvailable ? (
                          <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5 space-y-2.5 text-xs">
                            <div className="flex flex-wrap items-center gap-4 font-mono font-semibold">
                              <span className="text-emerald-800">
                                Test Cases Passed: {item.testCasesPassed}
                              </span>
                              <span className="text-rose-800">
                                Test Cases Failed: {item.testCasesFailed}
                              </span>
                            </div>

                            {Array.isArray(item.testCaseResults) &&
                              item.testCaseResults.length > 0 && (
                                <div className="space-y-2 pt-1">
                                  {item.testCaseResults.map((tc) => (
                                    <div
                                      key={tc.index}
                                      className="rounded border border-slate-200 bg-white p-2.5 font-mono space-y-0.5"
                                    >
                                      <div className="font-sans font-semibold flex items-center gap-1.5">
                                        {tc.passed ? (
                                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                                        ) : (
                                          <XCircle className="h-3.5 w-3.5 text-rose-700" />
                                        )}
                                        <span>
                                          Test Case {tc.index}{' '}
                                          {tc.isHidden ? '(Hidden)' : '(Sample)'}:{' '}
                                          {tc.passed ? 'Passed' : 'Failed'}
                                        </span>
                                      </div>
                                      {!tc.isHidden && (
                                        <>
                                          <div>Input: {tc.input || '(empty)'}</div>
                                          <div>Expected: {tc.expectedOutput}</div>
                                          <div>Actual: {tc.actualOutput || '(empty)'}</div>
                                        </>
                                      )}
                                      {tc.stderr && (
                                        <div className="text-rose-700">
                                          Stderr: {tc.stderr}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
                            <span className="font-semibold">
                              Execution Status:{' '}
                            </span>
                            {item.feedback ||
                              'No sandboxed code execution service was configured, so automated test case pass/fail results are unavailable.'}
                          </div>
                        )}

                        {item.referenceSolution && (
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                              Reference Solution
                            </h3>
                            <pre className="code-block">{item.referenceSolution}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Debugging Review */}
                    {item.type === 'debugging' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                            Your Submitted Fix
                          </h3>
                          <pre className="code-block">
                            {item.userResponse || '// No changes submitted'}
                          </pre>
                          {item.issueNotes && (
                            <p className="mt-2 text-xs text-slate-700">
                              <span className="font-semibold">Your Notes: </span>
                              {item.issueNotes}
                            </p>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                            Reference Corrected Solution
                          </h3>
                          <pre className="code-block">{item.correctedSolution}</pre>
                          {item.identifiedIssue && (
                            <p className="mt-2 text-xs text-slate-700">
                              <span className="font-semibold">Identified Defect: </span>
                              {item.identifiedIssue}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Conceptual Review */}
                    {item.type === 'conceptual' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs sm:text-sm">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                            Your Response
                          </h3>
                          <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                            {item.userResponse || 'No response submitted.'}
                          </p>
                        </div>
                        <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3.5">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900 mb-1.5">
                            Reference Answer
                          </h3>
                          <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                            {item.correctAnswer}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Feedback & Explanation */}
                    {(item.feedback || item.explanation) && (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs sm:text-sm">
                        {item.feedback && (
                          <p className="text-slate-700">
                            <span className="font-semibold text-slate-900">
                              Evaluation Note:{' '}
                            </span>
                            {item.feedback}
                          </p>
                        )}
                        {item.explanation && (
                          <p className="text-slate-800 leading-relaxed">
                            <span className="font-semibold text-slate-900">
                              Explanation:{' '}
                            </span>
                            {item.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
