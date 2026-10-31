import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

export function ErrorState({
  title = 'Request could not be completed',
  message,
  code,
  details,
  onRetry,
  retryLabel = 'Try Again',
  secondaryAction,
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-rose-200 bg-rose-50/60 p-5 text-left"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          aria-hidden="true"
          className="h-5 w-5 text-rose-700 shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-rose-950">{title}</h3>
            {code && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                {code}
              </span>
            )}
          </div>
          {message && (
            <p className="mt-1.5 text-sm text-rose-900 leading-relaxed">
              {message}
            </p>
          )}
          {details && typeof details === 'object' && (
            <ul className="mt-2.5 space-y-1 text-xs text-rose-900 list-disc list-inside">
              {Object.entries(details).map(([field, errText]) => (
                <li key={field}>
                  <span className="font-medium">{field}:</span> {String(errText)}
                </li>
              ))}
            </ul>
          )}
          {(onRetry || secondaryAction) && (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  {retryLabel}
                </Button>
              )}
              {secondaryAction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
