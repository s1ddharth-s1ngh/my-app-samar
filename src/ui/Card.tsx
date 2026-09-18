import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Inside a panel the card carries no fill: the border does the separating. */
  inset?: boolean;
  /** Neutral hover — only for cards that are actually clickable. */
  interactive?: boolean;
}

const PADDINGS = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', inset = false, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Depth comes from the border and the step between page and card,
        // never from a shadow.
        'rounded-xl border border-border',
        inset ? 'bg-transparent' : 'bg-card',
        interactive && 'cursor-pointer transition-colors hover:bg-muted/40',
        PADDINGS[padding],
        className
      )}
      {...props}
    />
  )
);

Card.displayName = 'Card';
