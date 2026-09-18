import { type HTMLAttributes, forwardRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  /** Status is soft, never a filled badge. Inactive is muted grey, not red. */
  variant?: 'neutral' | 'brand' | 'good' | 'warn' | 'bad';
  onDelete?: () => void;
}

const VARIANTS = {
  neutral: '',
  brand: 'status-brand',
  good: 'status-good',
  warn: 'status-warn',
  bad: 'status-bad',
} as const;

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ children, variant = 'neutral', onDelete, className, ...props }, ref) => (
    <span ref={ref} className={cn('status-chip', VARIANTS[variant], className)} {...props}>
      {children}
      {onDelete && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete();
          }}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10"
          aria-label="Rimuovi"
        >
          <X size={10} aria-hidden="true" />
        </button>
      )}
    </span>
  )
);

Chip.displayName = 'Chip';
