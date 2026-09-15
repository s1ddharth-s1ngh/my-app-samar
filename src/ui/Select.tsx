import { type SelectHTMLAttributes, forwardRef, useId } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helpText?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helpText, options, className = '', id: providedId, ...props }, ref) => {
    const defaultId = useId();
    const id = providedId || defaultId;

    return (
      <div className={`space-y-1.5 ${className}`}>
        <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        <div className="relative">
          <select
            id={id}
            ref={ref}
            className={`
              block w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-base 
              transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900
              dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:focus:ring-zinc-100 dark:focus:border-zinc-100
              disabled:opacity-50 disabled:bg-zinc-50
              ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-zinc-200'}
            `}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
            <svg
              className="h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
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

Select.displayName = 'Select';
