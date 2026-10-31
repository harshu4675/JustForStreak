import {
  CheckCircle2,
  Clock,
  HelpCircle,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import { formatDateTime, formatDurationReadable } from '../../utils/formatters.js';

export function ResultSummary({ result }) {
  const statusTone =
    result.percentage >= 80
      ? {
          badge: 'Strong Proficiency',
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        }
      : result.percentage >= 50
        ? {
            badge: 'Working Proficiency',
            classes: 'bg-amber-50 text-amber-800 border-amber-200',
          }
        : {
            badge: 'Needs Reinforcement',
            classes: 'bg-rose-50 text-rose-800 border-rose-200',
          };

  return (
    <section className="surface-panel overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">{result.subject}</span>
            {result.programmingLanguage && (
              <>
                <span>·</span>
                <span className="font-mono">{result.programmingLanguage}</span>
              </>
            )}
            <span>·</span>
            <span>{result.skillLevel}</span>
            <span>·</span>
            <span>Completed {formatDateTime(result.submittedAt)}</span>
          </div>
          <h1 className="mt-1.5 text-xl sm:text-2xl font-semibold text-slate-900">
            {result.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`rounded-md border px-3 py-1 text-xs font-semibold ${statusTone.classes}`}
          >
            {statusTone.badge}
          </span>
          <div className="text-right">
            <p className="font-mono text-2xl sm:text-3xl font-bold text-slate-900">
              {result.percentage}%
            </p>
            <p className="font-mono text-xs text-slate-500">
              {result.score} / {result.maximumScore} marks
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/60">
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-emerald-700" />
            <span>Correct</span>
          </div>
          <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
            {result.correctCount}
          </p>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <XCircle aria-hidden="true" className="h-3.5 w-3.5 text-rose-700" />
            <span>Incorrect</span>
          </div>
          <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
            {result.incorrectCount}
          </p>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <HelpCircle aria-hidden="true" className="h-3.5 w-3.5 text-amber-700" />
            <span>Partial</span>
          </div>
          <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
            {result.partialCount || 0}
          </p>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <MinusCircle aria-hidden="true" className="h-3.5 w-3.5 text-slate-500" />
            <span>Unanswered</span>
          </div>
          <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
            {result.unansweredCount}
          </p>
        </div>

        <div className="p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock aria-hidden="true" className="h-3.5 w-3.5 text-slate-500" />
            <span>Time Taken</span>
          </div>
          <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
            {formatDurationReadable(result.timeTaken)}
          </p>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6 space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Performance Summary
        </h2>
        <p className="text-sm text-slate-800 leading-relaxed">
          {result.performanceSummary}
        </p>
        {result.negativeMarksDeducted > 0 && (
          <p className="text-xs text-rose-800 font-medium">
            Negative marking deducted {result.negativeMarksDeducted} mark(s) across incorrect multiple-choice selections.
          </p>
        )}
      </div>
    </section>
  );
}
