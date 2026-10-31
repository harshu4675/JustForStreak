import { useId } from 'react';
import { Check } from 'lucide-react';

export function RadioGroup({
  name,
  label,
  value,
  onChange,
  options = [],
  error,
  columns = 1,
}) {
  const generatedName = useId();
  const groupName = name || generatedName;
  const gridClass =
    columns === 2
      ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5'
      : 'flex flex-col gap-2.5';

  return (
    <fieldset>
      {label && (
        <legend className="text-sm font-medium text-slate-800 mb-2">
          {label}
        </legend>
      )}
      <div className={gridClass} role="radiogroup">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          const isDisabled = Boolean(opt.disabled);
          const optionId = `${groupName}-${opt.value}`;

          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              className={`relative flex items-start gap-3 rounded-md border p-3.5 transition-colors ${
                isDisabled
                  ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                  : isSelected
                    ? 'border-blue-600 bg-blue-50/60 cursor-pointer'
                    : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
              }`}
            >
              <input
                id={optionId}
                type="radio"
                name={groupName}
                value={opt.value}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => !isDisabled && onChange(opt.value)}
                className="mt-1 h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {opt.label}
                  </span>
                  {opt.badge && (
                    <span className="text-xs font-mono text-slate-500">
                      {opt.badge}
                    </span>
                  )}
                </span>
                {opt.description && (
                  <span className="block text-xs text-slate-600 mt-1 leading-relaxed">
                    {opt.description}
                  </span>
                )}
              </span>
              {isSelected && (
                <Check
                  aria-hidden="true"
                  className="h-4 w-4 text-blue-600 shrink-0 mt-0.5"
                />
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-700 font-medium">
          {error}
        </p>
      )}
    </fieldset>
  );
}
