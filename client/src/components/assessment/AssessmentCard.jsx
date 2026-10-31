import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, RotateCcw } from 'lucide-react';
import { formatDateTime, formatDurationReadable } from '../../utils/formatters.js';
import { clearStoredAssessmentProgress } from '../../hooks/useAssessmentProgress.js';

export function AssessmentCard({ item }) {
  const scoreBadgeClass =
    item.percentage >= 80
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : item.percentage >= 50
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-rose-50 text-rose-800 border-rose-200';

  return (
    <div className="surface-panel p-4 flex flex-col justify-between gap-4 hover:border-slate-300 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">
              {item.subject}
              {item.programmingLanguage ? ` · ${item.programmingLanguage}` : ''}
            </p>
            <h3 className="mt-0.5 text-sm font-semibold text-slate-900 truncate">
              {item.title}
            </h3>
          </div>
          <span
            className={`shrink-0 rounded border px-2 py-0.5 font-mono text-xs font-semibold ${scoreBadgeClass}`}
          >
            {item.percentage}%
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
            {item.skillLevel}
          </span>
          <span className="font-mono">
            {item.score}/{item.maximumScore} pts
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Clock aria-hidden="true" className="h-3 w-3" />
            {formatDurationReadable(item.timeTaken)}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">{formatDateTime(item.completedAt)}</span>
        <div className="flex items-center gap-3">
          <Link
            to={`/assessments/${item.assessmentId}/take`}
            onClick={() => clearStoredAssessmentProgress(item.assessmentId)}
            className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
          >
            <RotateCcw aria-hidden="true" className="h-3 w-3" />
            Retake
          </Link>
          <Link
            to={`/assessments/${item.assessmentId}/result?attemptId=${encodeURIComponent(item.attemptId)}`}
            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
          >
            Results
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
