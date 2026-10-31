export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      {Icon && (
        <div className="mx-auto mb-3.5 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm text-slate-600 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
