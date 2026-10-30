import type { InputHTMLAttributes } from 'react';

/** Labeled input primitive that wires hints and validation messages to the field. */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export default function Input({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-surface-300">
        {label}
        {props.required && <span className="text-red-400 ml-1" aria-hidden="true">*</span>}
      </label>

      <input
        id={inputId}
        className={`w-full px-3 py-2.5 bg-white/5 border rounded-xl text-surface-100 placeholder:text-surface-600 transition-colors focus:bg-white/10 focus:border-brand-500 ${
          error ? 'border-red-400' : 'border-white/10'
        } ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        {...props}
      />

      {hint && !error && (
        <p id={hintId} className="text-xs text-surface-500">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
}
