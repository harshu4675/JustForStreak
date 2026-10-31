const VARIANT_CLASSES = {
  primary:
    'bg-slate-900 text-white border border-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:border-slate-400',
  accent:
    'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:border-blue-300',
  secondary:
    'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 disabled:text-slate-400 disabled:bg-slate-50',
  ghost:
    'bg-transparent text-slate-700 border border-transparent hover:bg-slate-100 hover:text-slate-900 disabled:text-slate-400',
  danger:
    'bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:border-rose-300',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  ...rest
}) {
  const variantCls = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
  const sizeCls = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed ${variantCls} ${sizeCls} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
}
