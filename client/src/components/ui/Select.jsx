import { useId } from 'react';

export function Select({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  className = '',
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const descId = error ? `${selectId}-error` : helperText ? `${selectId}-help` : undefined;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-800 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-600 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={descId}
        className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 bg-white transition-colors disabled:bg-slate-100 disabled:text-slate-500 ${
          error
            ? 'border-rose-500 focus:border-rose-600'
            : 'border-slate-300 focus:border-blue-600'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          const optDisabled = typeof opt === 'object' && Boolean(opt.disabled);
          return (
            <option key={val} value={val} disabled={optDisabled}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error ? (
        <p id={`${selectId}-error`} role="alert" className="mt-1.5 text-xs text-rose-700 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${selectId}-help`} className="mt-1.5 text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
