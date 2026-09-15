import { type HTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 ${className}`}
      {...props}
    >
      <div className="w-16 h-16 mb-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 dark:text-zinc-500">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
