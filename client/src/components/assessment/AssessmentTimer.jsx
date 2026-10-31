import { AlertTriangle, Clock } from 'lucide-react';
import { formatCountdown } from '../../utils/formatters.js';

export function AssessmentTimer({ enabled, remainingSeconds }) {
  if (!enabled || remainingSeconds === null) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
        <span>Untimed</span>
      </div>
    );
  }

  const isCritical = remainingSeconds <= 60;
  const isWarning = remainingSeconds > 60 && remainingSeconds <= 300;

  const containerClass = isCritical
    ? 'border-rose-300 bg-rose-50 text-rose-900'
    : isWarning
      ? 'border-amber-300 bg-amber-50 text-amber-900'
      : 'border-slate-200 bg-slate-50 text-slate-800';

  return (
    <div
      role="timer"
      aria-label="Remaining assessment time"
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 ${containerClass}`}
    >
      {isCritical || isWarning ? (
        <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      )}
      <span className="font-mono text-xs sm:text-sm font-semibold tracking-tight">
        {formatCountdown(remainingSeconds)}
      </span>
      {isCritical && (
        <span className="hidden sm:inline text-[11px] font-semibold uppercase">
          Final minute
        </span>
      )}
    </div>
  );
}
