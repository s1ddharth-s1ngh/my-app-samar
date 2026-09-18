import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          role="separator"
          aria-orientation="vertical"
          className={cn('h-6 w-px bg-white/[0.08]', className)}
        />
      );
    }

    return (
      <hr
        ref={ref}
        className={cn('w-full border-0 border-t border-white/[0.06]', className)}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';
