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
  primary: 'bg-ink text-bg hover:opacity-90 focus-visible:outline-ink',
  secondary: 'bg-line/50 text-ink hover:bg-line focus-visible:outline-ink-muted',
  ghost:
    'bg-transparent text-ink-muted hover:bg-line/40 hover:text-ink focus-visible:outline-ink-muted',
  destructive: 'bg-alert/10 text-alert hover:bg-alert/20 focus-visible:outline-alert',
  glass: 'glass glass-interactive text-ink focus-visible:outline-accent',
};

// 44px minimum touch target on every size, per the mobile polish rules.
const SIZES = {
  sm: 'h-11 w-11',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
} as const;

const ICON_SIZES = { sm: 16, md: 20, lg: 24 } as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = 'ghost', size = 'md', className = '', label, ...props }, ref) => {
    const classes = [
      'inline-flex items-center justify-center rounded-full',
      'transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
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
