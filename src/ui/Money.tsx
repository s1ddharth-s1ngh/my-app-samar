import { type HTMLAttributes, forwardRef } from 'react';
import { formatCents } from '@/domain/money';

export interface MoneyProps extends HTMLAttributes<HTMLSpanElement> {
  cents: number;
  showSign?: boolean;
  /** Green above zero, red below. Off by default: most amounts are neutral. */
  semanticColor?: boolean;
  /** Hides the decimals on whole euros, for dense lists. */
  compact?: boolean;
}

export const Money = forwardRef<HTMLSpanElement, MoneyProps>(
  (
    { cents, showSign = false, semanticColor = false, compact = false, className = '', ...props },
    ref
  ) => {
    const color = !semanticColor ? '' : cents > 0 ? 'text-success' : cents < 0 ? 'text-alert' : '';

    return (
      <span
        ref={ref}
        data-numeric=""
        className={`tabular-nums ${color} ${className}`.trim()}
        {...props}
      >
        {formatCents(cents, { showSign, compact })}
      </span>
    );
  }
);

Money.displayName = 'Money';
