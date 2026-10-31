export function TopicPerformance({
  title = 'Topic-wise Performance',
  items = [],
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className="surface-panel p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">{title}</h2>

      <div className="space-y-3.5">
        {items.map((item) => {
          const widthPct = Math.min(100, Math.max(0, Math.round(item.percentage)));
          const barColor =
            item.percentage >= 80
              ? 'bg-emerald-600'
              : item.percentage >= 50
                ? 'bg-blue-600'
                : 'bg-rose-600';

          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-slate-800 truncate">
                  {item.label}
                </span>
                <span className="font-mono text-slate-600 shrink-0">
                  {item.earnedMarks}/{item.maxMarks} pts ({item.percentage}%)
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${item.label} score percentage`}
                aria-valuenow={widthPct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"
              >
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
