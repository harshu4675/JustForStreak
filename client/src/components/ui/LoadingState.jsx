export function LoadingState({
  title = 'Loading workspace',
  description = 'Fetching data from the server...',
  compact = false,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8 px-4' : 'py-16 px-4'
      }`}
    >
      <div
        aria-hidden="true"
        className="h-7 w-7 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin mb-3.5"
      />
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-600 max-w-md leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
