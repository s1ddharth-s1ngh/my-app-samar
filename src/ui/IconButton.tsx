import { type ButtonHTMLAttributes, forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  glassButtonClass,
  glassPrimaryButtonClass,
  glassRowActionClass,
  glassRowDestructiveActionClass,
} from '@/lib/glass';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  /** Required: the button carries no visible text. */
  label: string;
}

const VARIANTS: Record<NonNullable<IconButtonProps['variant']>, string> = {
  primary: glassPrimaryButtonClass,
  secondary: glassButtonClass,
  ghost: glassRowActionClass,
  destructive: glassRowDestructiveActionClass,
};

/** Row actions are 32px; anything that stands alone keeps a 44px touch target. */
const SIZES = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
} as const;

const ICON_SIZES = { sm: 15, md: 17, lg: 20 } as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = 'ghost', size = 'md', className, label, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'disabled:opacity-40 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      <Icon size={ICON_SIZES[size]} aria-hidden="true" />
    </button>
  )
);

IconButton.displayName = 'IconButton';
