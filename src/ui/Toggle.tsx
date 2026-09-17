import { type InputHTMLAttributes, forwardRef, useId } from 'react';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, className = '', id: providedId, checked, disabled, ...props }, ref) => {
    const defaultId = useId();
    const id = providedId ?? defaultId;

    return (
      <div className={`flex items-start justify-between gap-4 py-2 ${className}`}>
        <div className="flex flex-col gap-0.5 min-w-0">
          <label htmlFor={id} className="text-[15px] font-medium text-ink cursor-pointer">
            {label}
          </label>
          {description && <p className="text-sm text-ink-faint">{description}</p>}
        </div>
        <label
          htmlFor={id}
          className={`relative inline-flex shrink-0 items-center mt-0.5 ${
            disabled ? 'opacity-50' : 'cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            id={id}
            ref={ref}
            className="sr-only peer"
            checked={checked}
            disabled={disabled}
            {...props}
          />
          <span
            className="
              block w-11 h-6 rounded-full bg-surface-3 border border-line
              transition-colors duration-200 motion-reduce:transition-none
              peer-checked:bg-accent peer-checked:border-accent
              peer-focus-visible:shadow-[var(--shadow-focus)]
              after:content-[''] after:absolute after:top-1 after:left-1
              after:h-4 after:w-4 after:rounded-full after:bg-ink
              after:transition-transform after:duration-200 motion-reduce:after:transition-none
              peer-checked:after:translate-x-5 peer-checked:after:bg-white
            "
          />
        </label>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
