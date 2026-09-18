import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';
import {
  glassButtonClass,
  glassDestructiveButtonClass,
  glassPrimaryButtonClass,
} from '@/lib/glass';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * Every button is a pill. There are no filled coloured buttons in this system:
 * the primary action is a denser frost, the destructive one a soft red veil.
 */
const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: glassPrimaryButtonClass,
  secondary: glassButtonClass,
  ghost:
    'rounded-full text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground transition-colors',
  destructive: glassDestructiveButtonClass,
};

const SIZES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap',
        'disabled:opacity-40 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
