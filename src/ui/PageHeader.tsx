import { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  /** One line saying what this page does. */
  subtitle?: ReactNode;
  breadcrumb?: { to: string; label: string };
  /** Small caps line above the title, when the page belongs to a group. */
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

/** Every page opens the same way: where you came from, what this is, what you can do. */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {breadcrumb && (
        <Link
          to={breadcrumb.to}
          className="inline-flex items-center gap-1.5 text-[12px] text-white/45 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {breadcrumb.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className={cn('text-2xl font-bold tracking-tight text-white', eyebrow && 'mt-1')}>
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 text-[12px] text-white/40">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
    </div>
  );
}
