import { useId } from 'react';

export function Checkbox({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
}) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <label
      htmlFor={checkboxId}
      className={`flex items-start gap-3 select-none ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
      />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        {description && (
          <span className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
