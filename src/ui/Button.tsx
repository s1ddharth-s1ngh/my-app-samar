import { type ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `glass` and `glassProminent` mirror Apple's glass button styles. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'glass' | 'glassProminent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-ink text-bg hover:opacity-90 focus-visible:outline-ink',
  secondary: 'bg-line/50 text-ink hover:bg-line focus-visible:outline-ink-muted',
  ghost:
    'bg-transparent text-ink-muted hover:bg-line/40 hover:text-ink focus-visible:outline-ink-muted',
  destructive: 'bg-alert text-white hover:opacity-90 focus-visible:outline-alert',
  glass: 'glass glass-interactive text-ink focus-visible:outline-accent',
  glassProminent:
    'glass glass-interactive glass-tint-accent text-accent font-semibold focus-visible:outline-accent',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-14 px-6 text-lg',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => {
    const classes = [
      'inline-flex items-center justify-center font-medium rounded-2xl',
      'transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
      VARIANTS[variant],
      SIZES[size],
      fullWidth ? 'w-full' : '',
      className,
    ]
      .join(' ')
      .trim();

    return <button ref={ref} className={classes} {...props} />;
  }
);

Button.displayName = 'Button';
