import { type ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `glass` and `glassProminent` mirror Apple's glass button styles. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'glass' | 'glassProminent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-accent text-white border border-accent hover:bg-accent-strong hover:border-accent-strong',
  secondary: 'bg-surface-3 text-ink border border-line hover:border-line-strong hover:bg-surface-2',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:text-ink hover:bg-surface-2',
  destructive: 'bg-alert text-white border border-alert hover:opacity-90',
  glass: 'glass glass-interactive text-ink',
  glassProminent: 'glass glass-interactive glass-tint-accent text-ink font-semibold',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-13 px-6 text-base',
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => {
    const classes = [
      'inline-flex items-center justify-center gap-2 font-medium rounded-[12px]',
      'transition-[background-color,border-color,color,transform] duration-200 motion-reduce:transition-none',
      'disabled:opacity-40 disabled:pointer-events-none',
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
