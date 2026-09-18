import { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Renders a back link to this route on the left of the title. */
  backTo?: string;
  backLabel?: string;
  action?: ReactNode;
}

/** Every screen opens the same way: where you are, what it is, what you can do. */
export function PageHeader({ title, subtitle, backTo, backLabel, action }: PageHeaderProps) {
  return (
    <header className="space-y-3">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          {backLabel ?? 'Indietro'}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-foreground tracking-[-0.02em]">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
