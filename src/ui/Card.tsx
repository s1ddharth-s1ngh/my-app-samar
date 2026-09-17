import { type HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** `raised` adds the panel shadow; `flat` is the default hairline card. */
  elevation?: 'flat' | 'raised';
  /** Lifts the border on hover — only for cards that are actually clickable. */
  interactive?: boolean;
}

const PADDINGS = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-7',
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'md', elevation = 'flat', interactive = false, ...props }, ref) => {
    const classes = [
      'bg-surface border border-line rounded-[18px] overflow-hidden',
      'transition-colors duration-200 motion-reduce:transition-none',
      elevation === 'raised' ? 'shadow-[var(--shadow-panel)]' : '',
      interactive ? 'hover:border-line-strong hover:bg-surface-2 cursor-pointer' : '',
      PADDINGS[padding],
      className,
    ]
      .join(' ')
      .trim();

    return <div ref={ref} className={classes} {...props} />;
  }
);

Card.displayName = 'Card';
