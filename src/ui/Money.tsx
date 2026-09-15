import { type HTMLAttributes, forwardRef } from 'react';

export interface MoneyProps extends HTMLAttributes<HTMLSpanElement> {
  cents: number;
  showSign?: boolean;
  semanticColor?: boolean;
}

export const formatCents = (cents: number, showSign: boolean = false) => {
  const amount = cents / 100;
  const formatter = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    signDisplay: showSign ? 'always' : 'auto',
  });
  return formatter.format(amount);
};

export const Money = forwardRef<HTMLSpanElement, MoneyProps>(
  ({ cents, showSign = false, semanticColor = false, className = '', ...props }, ref) => {
    const formatted = formatCents(cents, showSign);

    let colorClass = '';
    if (semanticColor) {
      if (cents > 0) colorClass = 'text-green-600 dark:text-green-500';
      else if (cents < 0) colorClass = 'text-red-600 dark:text-red-500';
    }

    return (
      <span ref={ref} className={`tabular-nums ${colorClass} ${className}`} {...props}>
        {formatted}
      </span>
    );
  }
);

Money.displayName = 'Money';
