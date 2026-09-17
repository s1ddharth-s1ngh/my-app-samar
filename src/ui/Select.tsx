import { type SelectHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { inputClasses } from './Field';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helpText?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helpText, options, className = '', id: providedId, ...props }, ref) => {
    const defaultId = useId();
    const id = providedId ?? defaultId;

    return (
      <div className={`space-y-1.5 ${className}`}>
        <label htmlFor={id} className="kpi-label block">
          {label}
        </label>
        <div className="relative">
          <select
            id={id}
            ref={ref}
            className={`${inputClasses(Boolean(error))} appearance-none pr-11`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-4 my-auto text-ink-faint"
          />
        </div>
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

Select.displayName = 'Select';
