import { type ButtonHTMLAttributes, forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ICON_ACTION, ICON_ACTION_DANGER } from '@/lib/surfaces';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'quiet' | 'danger' | 'solid';
  /** `sm` is the 28px row action; `md` stands on its own at 32px. */
  size?: 'sm' | 'md';
  /** Required: the button carries no visible text. */
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = 'quiet', size = 'sm', className, label, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        variant === 'danger'
          ? ICON_ACTION_DANGER
          : variant === 'solid'
            ? 'h-7 w-7 inline-flex items-center justify-center rounded-full bg-white/[0.06] text-white hover:bg-white/[0.12] transition-colors'
            : ICON_ACTION,
        size === 'md' ? 'h-8 w-8' : 'h-7 w-7',
        'disabled:pointer-events-none disabled:opacity-40',
        className
      )}
      {...props}
    >
      <Icon className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
    </button>
  )
);

IconButton.displayName = 'IconButton';
