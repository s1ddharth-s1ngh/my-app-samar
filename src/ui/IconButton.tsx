import { type ButtonHTMLAttributes, forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  /** Required: the button carries no visible text. */
  label: string;
}

const VARIANTS: Record<NonNullable<IconButtonProps['variant']>, string> = {
  primary: 'bg-accent text-white border border-accent hover:bg-accent-strong',
  secondary: 'bg-surface-3 text-ink border border-line hover:border-line-strong',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:text-ink hover:bg-surface-2',
  destructive:
    'bg-transparent text-ink-muted border border-transparent hover:text-alert hover:bg-alert/10',
  glass: 'glass glass-interactive text-ink',
};

// 44px minimum touch target on every size, per the mobile polish rules.
const SIZES = {
  sm: 'h-11 w-11',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
} as const;

const ICON_SIZES = { sm: 16, md: 18, lg: 22 } as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = 'ghost', size = 'md', className = '', label, ...props }, ref) => {
    const classes = [
      'inline-flex items-center justify-center rounded-[12px]',
      'transition-colors duration-200 motion-reduce:transition-none',
      'disabled:opacity-40 disabled:pointer-events-none',
      VARIANTS[variant],
      SIZES[size],
      className,
    ]
      .join(' ')
      .trim();

    return (
      <button ref={ref} className={classes} aria-label={label} title={label} {...props}>
        <Icon size={ICON_SIZES[size]} aria-hidden="true" />
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
