import { type SelectHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MICRO_LABEL } from '@/lib/surfaces';
import { inputClasses } from './inputStyles';

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
        <label htmlFor={id} className={cn(MICRO_LABEL, 'block')}>
          {label}
        </label>
        <div className="relative">
          <select
            id={id}
            ref={ref}
            className={`${inputClasses(Boolean(error))} appearance-none pr-9`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-card">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3.5 my-auto text-muted-foreground"
          />
        </div>
        {error ? (
          <p id={`${id}-error`} className="text-[11px] text-bad">
            {error}
          </p>
        ) : helpText ? (
          <p id={`${id}-help`} className="text-[11px] text-muted-foreground">
            {helpText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
