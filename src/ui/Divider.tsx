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
          className={`h-full w-px bg-zinc-200 dark:bg-zinc-800 ${className}`}
        />
      );
    }

    return (
      <hr
        ref={ref}
        className={`border-t border-zinc-200 dark:border-zinc-800 w-full ${className}`}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';
