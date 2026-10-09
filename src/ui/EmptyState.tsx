import { type HTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[200px] flex-col items-center justify-center p-10 text-center',
        className
      )}
      {...props}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-foreground/[0.03]">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-[13px] font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[11.5px] text-muted-foreground">{description}</p>
      )}
      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
}
