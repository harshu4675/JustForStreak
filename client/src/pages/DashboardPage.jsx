import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Compass,
  Plus,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService.js';
import { assessmentService } from '../services/assessmentService.js';
import { AssessmentCard } from '../components/assessment/AssessmentCard.jsx';
import { AssessmentHistory } from '../components/dashboard/AssessmentHistory.jsx';
import { Button } from '../components/ui/Button.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export function DashboardPage() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, progressData, historyData] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getProgress(),
        assessmentService.getHistory(),
      ]);
      setSummary(summaryData);
      setProgress(progressData);
      setHistory(historyData.history || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <LoadingState
        title="Loading candidate dashboard"
        description="Retrieving assessment history and progression metrics..."
      />
    );
  }

  if (error || !summary || !progress) {
    return (
      <ErrorState
        title="Unable to Load Dashboard"
        message={error?.message || 'Failed to retrieve dashboard statistics.'}
        code={error?.code}
        onRetry={loadDashboard}
      />
    );
  }

  const handleLaunchRecommended = () => {
    const rec = summary.recommendedNextAssessment;
    if (!rec) {
      navigate('/configure');
      return;
    }
    const params = new URLSearchParams({
      subject: rec.subject,
      skillLevel: rec.skillLevel,
      assessmentType: rec.assessmentType || 'Mixed Assessment',
    });
    if (rec.programmingLanguage) {
      params.set('programmingLanguage', rec.programmingLanguage);
    }
    if (Array.isArray(rec.focusTopics) && rec.focusTopics.length > 0) {
      params.set('topics', rec.focusTopics.join(','));
    }
    navigate(`/configure?${params.toString()}`);
  };

  if (summary.totalAssessmentsCompleted === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="section-label">Dashboard</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              Performance Overview
            </h1>
          </div>
          <Button variant="primary" onClick={() => navigate('/configure')}>
            <Plus className="h-4 w-4" />
            New Assessment
          </Button>
        </div>

        <EmptyState
          icon={ClipboardList}
          title="No assessments completed yet"
          description="Generate and submit your first assessment to track score trends, subject accuracy, and skill-level progression."
          action={
            <Button variant="accent" size="md" onClick={handleLaunchRecommended}>
              Configure First Assessment
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        />
      </div>
    );
  }

  const rec = summary.recommendedNextAssessment;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="section-label">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Performance & Skill Progression
          </h1>
        </div>
        <Button variant="primary" onClick={() => navigate('/configure')}>
          <Plus className="h-4 w-4" />
          New Assessment
        </Button>
      </div>

      {/* Real Stored Metrics */}
      <section
        aria-label="Key assessment metrics"
        className="surface-panel grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 sm:divide-x divide-slate-200"
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ClipboardList aria-hidden="true" className="h-4 w-4" />
            <span>Completed Assessments</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">
            {summary.totalAssessmentsCompleted}
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BarChart3 aria-hidden="true" className="h-4 w-4" />
            <span>Average Score</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">
            {summary.averageScore}%
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Award aria-hidden="true" className="h-4 w-4" />
            <span>Highest Score</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">
            {summary.highestScore}%
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            <span>Subjects Assessed</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">
            {summary.subjectsPracticed}
          </p>
        </div>
      </section>

      {/* Recommended Next Assessment */}
      {rec && (
        <section className="rounded-lg border border-blue-200 bg-blue-50/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-800">
              <Compass aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Recommended Next Assessment</span>
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {rec.subject}
              {rec.programmingLanguage ? ` (${rec.programmingLanguage})` : ''} —{' '}
              {rec.skillLevel}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
              {rec.reason}
            </p>
          </div>
          <Button
            variant="accent"
            size="md"
            onClick={handleLaunchRecommended}
            className="shrink-0"
          >
            Start Recommended
            <ArrowRight className="h-4 w-4" />
          </Button>
        </section>
      )}

      {/* Recent Assessments */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Recent Assessments
          </h2>
          <Link
            to="/history"
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            View full history
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {summary.recentAssessments.slice(0, 3).map((item) => (
            <AssessmentCard key={item.attemptId} item={item} />
          ))}
        </div>
      </section>

      {/* Subject-wise Progress & Skill Level Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="surface-panel p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Subject-wise Progress
          </h2>
          <div className="space-y-4">
            {progress.subjectProgress.map((subj) => (
              <div key={subj.subject} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">
                      {subj.subject}
                    </span>
                    <span className="ml-2 text-slate-500">
                      ({subj.attemptsCount}{' '}
                      {subj.attemptsCount === 1 ? 'attempt' : 'attempts'} · Highest tier:{' '}
                      {subj.highestSkillLevel})
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-slate-800">
                    Avg {subj.averagePercentage}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${Math.min(100, Math.max(0, Math.round(subj.averagePercentage)))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-panel p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Skill Level Progression
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {progress.skillProgression.map((tier) => (
              <div
                key={tier.skillLevel}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-slate-400">L{tier.rank}</span>
                  <span className="font-medium text-slate-900 truncate">
                    {tier.skillLevel}
                  </span>
                  {tier.mastered && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Mastered
                    </span>
                  )}
                </div>

                {tier.attemptsCount > 0 ? (
                  <span className="font-mono text-slate-700 shrink-0">
                    {tier.attemptsCount}x · Best {tier.highestPercentage}%
                  </span>
                ) : (
                  <span className="text-slate-400 shrink-0">Not attempted</span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Assessment History Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Assessment History
          </h2>
          <span className="font-mono text-xs text-slate-500">
            {history.length} total record(s)
          </span>
        </div>
        <AssessmentHistory items={history.slice(0, 8)} />
      </section>
    </div>
  );
}
