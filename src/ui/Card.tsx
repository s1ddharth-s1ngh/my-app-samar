import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { CARD } from '@/lib/surfaces';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Drops the built-in padding when the card holds its own scroll area. */
  flush?: boolean;
}

/** The default surface: a card floating on the black canvas. */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, flush = false, ...props }, ref) => (
    <div ref={ref} className={cn(CARD, flush && 'p-0', className)} {...props} />
  )
);

Card.displayName = 'Card';

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/** Title, one line of context, and at most one action on the right. */
export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-[13px] font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[10.5px] text-white/40">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
