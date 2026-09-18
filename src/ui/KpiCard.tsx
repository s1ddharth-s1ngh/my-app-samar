import { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface KpiCardProps {
  label: string;
  /** The headline figure. Pass a `<Money />` for amounts so it stays tabular. */
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  /** 0–1. Renders the thin progress rail under the figure. */
  progress?: number;
  /** Colour is information: only a real state earns one. */
  tone?: 'neutral' | 'primary' | 'warning' | 'destructive' | 'success';
  className?: string;
}

const TONE_TEXT = {
  neutral: 'text-foreground',
  primary: 'text-primary',
  warning: 'text-warning',
  destructive: 'text-destructive',
  success: 'text-success',
} as const;

const TONE_FILL = {
  neutral: 'bg-foreground/30',
  primary: 'bg-primary',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  success: 'bg-success',
} as const;

/**
 * The dense metric block: a micro-label, one big figure, and an optional rail
 * showing how far along it is. A container, so `rounded-xl`.
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  progress,
  tone = 'neutral',
  className,
}: KpiCardProps) {
  const clamped = progress === undefined ? undefined : Math.min(1, Math.max(0, progress));

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kpi-label">{label}</p>
          <p className={cn('kpi-number mt-1 truncate', TONE_TEXT[tone])}>{value}</p>
        </div>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon size={17} aria-hidden="true" />
          </span>
        )}
      </div>

      {clamped !== undefined && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none',
              TONE_FILL[tone]
            )}
            style={{ width: `${clamped * 100}%` }}
          />
        </div>
      )}

      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
