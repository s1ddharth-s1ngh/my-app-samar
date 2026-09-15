import { type InputHTMLAttributes, forwardRef, useId } from 'react';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, className = '', id: providedId, checked, ...props }, ref) => {
    const defaultId = useId();
    const id = providedId || defaultId;

    return (
      <div className={`flex items-start justify-between gap-4 py-2 ${className}`}>
        <div className="flex flex-col">
          <label
            htmlFor={id}
            className="text-base font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
          >
            {label}
          </label>
          {description && <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
        </div>
        <div className="relative inline-flex items-center cursor-pointer mt-1">
          <input
            type="checkbox"
            id={id}
            className="sr-only peer"
            ref={ref}
            checked={checked}
            {...props}
          />
          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-900 dark:peer-focus:ring-zinc-100 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-100"></div>
        </div>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
