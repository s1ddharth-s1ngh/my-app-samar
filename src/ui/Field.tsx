import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import { inputClasses } from './inputStyles';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

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
