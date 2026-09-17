import { type HTMLAttributes, forwardRef } from 'react';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ className = '', orientation = 'horizontal', ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          role="separator"
          aria-orientation="vertical"
          className={`h-full w-px bg-line ${className}`}
        />
      );
    }

    return (
      <hr ref={ref} className={`w-full border-0 border-t border-line ${className}`} {...props} />
    );
  }
);

Divider.displayName = 'Divider';
