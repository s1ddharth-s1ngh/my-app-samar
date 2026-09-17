import { type HTMLAttributes, forwardRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'error';
  onDelete?: () => void;
}

const VARIANTS = {
  neutral: 'bg-surface-3 text-ink-muted border-line',
  primary: 'bg-accent/12 text-accent-strong border-accent/25',
  success: 'bg-success/12 text-success border-success/25',
  warning: 'bg-signal/12 text-signal border-signal/25',
  error: 'bg-alert/12 text-alert border-alert/25',
} as const;

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ children, variant = 'neutral', onDelete, className = '', ...props }, ref) => {
    const classes = [
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] border',
      'text-[11px] font-medium uppercase tracking-[0.04em]',
      VARIANTS[variant],
      className,
    ]
      .join(' ')
      .trim();

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
        {onDelete && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }}
            className="inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-ink/10"
            aria-label="Rimuovi"
          >
            <X size={10} aria-hidden="true" />
          </button>
        )}
      </span>
    );
  }
);

Chip.displayName = 'Chip';
