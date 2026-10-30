import type { SelectHTMLAttributes } from 'react';

/** Option shape used by the shared select control. */
interface SelectOption {
  value: string;
  label: string;
}

/** Labeled select primitive with accessible validation feedback. */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export default function Select({
  label,
  options,
  error,
  placeholder,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-surface-300">
        {label}
        {props.required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
      </label>

      <select
        id={selectId}
        className={`select-control w-full px-3 py-2.5 border rounded-xl text-surface-100 transition-colors focus:bg-white/10 focus:border-brand-500 appearance-none cursor-pointer ${
          error ? 'border-red-400' : 'border-white/10'
        } ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p id={errorId} className="text-xs text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
}
