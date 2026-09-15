import { type InputHTMLAttributes, forwardRef, useId } from 'react';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, helpText, className = '', id: providedId, ...props }, ref) => {
    const defaultId = useId();
    const id = providedId || defaultId;

    return (
      <div className={`space-y-1.5 ${className}`}>
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        <div className="relative">
          <input
            id={id}
            ref={ref}
            className={`
              block w-full rounded-xl border bg-white px-4 py-3 text-base 
              transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900
              dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:focus:ring-zinc-100 dark:focus:border-zinc-100
              disabled:opacity-50 disabled:bg-zinc-50
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-zinc-200'}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
            {...props}
          />
        </div>
        {error ? (
          <p id={`${id}-error`} className="text-sm text-red-500">
            {error}
          </p>
        ) : helpText ? (
          <p id={`${id}-help`} className="text-sm text-zinc-500 dark:text-zinc-400">
            {helpText}
          </p>
        ) : null}
      </div>
    );
  }
);

Field.displayName = 'Field';
