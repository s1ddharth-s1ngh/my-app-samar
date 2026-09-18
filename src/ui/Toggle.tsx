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
          <label htmlFor={id} className="text-[13px] font-medium text-white cursor-pointer">
            {label}
          </label>
          {description && <p className="text-[11px] text-white/35">{description}</p>}
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
              block h-5 w-9 rounded-full border border-white/[0.08] bg-white/[0.06]
              transition-colors duration-200 motion-reduce:transition-none
              peer-checked:border-[#1E6FFF] peer-checked:bg-[#1E6FFF]
              peer-focus-visible:ring-2 peer-focus-visible:ring-[#1E6FFF]
              after:content-[''] after:absolute after:top-1 after:left-1
              after:h-3 after:w-3 after:rounded-full after:bg-white
              after:transition-transform after:duration-200 motion-reduce:after:transition-none
              peer-checked:after:translate-x-4
 "
          />
        </label>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
