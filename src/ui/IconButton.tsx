import { type ButtonHTMLAttributes, forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  label: string; // Required for accessibility
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = 'ghost', size = 'md', className = '', label, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-full';

    const variants = {
      primary:
        'bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200',
      secondary:
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700',
      ghost:
        'bg-transparent text-zinc-700 hover:bg-zinc-100 focus:ring-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-800',
      destructive:
        'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500 dark:bg-red-950 dark:hover:bg-red-900',
    };

    const sizes = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    const iconSizes = {
      sm: 16,
      md: 20,
      lg: 24,
    };

    const classes = [baseStyles, variants[variant], sizes[size], className].join(' ').trim();

    return (
      <button ref={ref} className={classes} aria-label={label} title={label} {...props}>
        <Icon size={iconSizes[size]} />
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
