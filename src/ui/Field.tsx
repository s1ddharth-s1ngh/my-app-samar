import { type InputHTMLAttributes, forwardRef, useId } from 'react';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

/** The shared look of every text input, select and textarea in the app. */
export const inputClasses = (hasError: boolean): string =>
  [
    'block w-full rounded-[12px] border bg-surface-2 px-4 py-3 text-ink',
    'placeholder:text-ink-faint',
    'transition-colors duration-200 motion-reduce:transition-none',
    'focus:outline-none focus:border-accent-strong focus:shadow-[var(--shadow-focus)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    hasError ? 'border-alert' : 'border-line',
  ].join(' ');

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, helpText, className = '', id: providedId, ...props }, ref) => {
    const defaultId = useId();
    const id = providedId ?? defaultId;

    return (
      <div className={`space-y-1.5 ${className}`}>
        <label htmlFor={id} className="kpi-label block">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          className={inputClasses(Boolean(error))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          {...props}
        />
        {error ? (
          <p id={`${id}-error`} className="text-sm text-alert">
            {error}
          </p>
        ) : helpText ? (
          <p id={`${id}-help`} className="text-sm text-ink-faint">
            {helpText}
          </p>
        ) : null}
      </div>
    );
  }
);

Field.displayName = 'Field';
