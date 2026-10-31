import { useId } from 'react';

export function Input({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  helperText,
  error,
  required = false,
  disabled = false,
  className = '',
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descId = error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-800 mb-1.5"
        >
          {label}
          {required && <span className="text-rose-600 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={descId}
        className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 transition-colors disabled:bg-slate-100 disabled:text-slate-500 ${
          error
            ? 'border-rose-500 focus:border-rose-600'
            : 'border-slate-300 focus:border-blue-600'
        }`}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs text-rose-700 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="mt-1.5 text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
