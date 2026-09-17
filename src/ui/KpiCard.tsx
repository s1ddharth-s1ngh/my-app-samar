import { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface KpiCardProps {
  label: string;
  /** The headline figure. Pass a `<Money />` for amounts so it stays tabular. */
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  /** 0–1. Renders the thin progress rail under the figure. */
  progress?: number;
  tone?: 'neutral' | 'accent' | 'signal' | 'alert' | 'success';
  className?: string;
}

const TONE_TEXT = {
  neutral: 'text-ink',
  accent: 'text-accent-strong',
  signal: 'text-signal',
  alert: 'text-alert',
  success: 'text-success',
} as const;

const TONE_FILL = {
  neutral: 'bg-ink-faint',
  accent: 'bg-accent',
  signal: 'bg-signal',
  alert: 'bg-alert',
  success: 'bg-success',
} as const;

/**
 * The dense metric block the dashboard is built from: a micro-label, one big
 * figure, and an optional rail showing how far along it is.
 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  progress,
  tone = 'neutral',
  className = '',
}: KpiCardProps) {
  const clamped = progress === undefined ? undefined : Math.min(1, Math.max(0, progress));

  return (
    <div
      className={`bg-surface border border-line rounded-[18px] p-4 transition-colors duration-200 hover:border-line-strong motion-reduce:transition-none ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kpi-label">{label}</p>
          <p className={`kpi-number mt-1 truncate ${TONE_TEXT[tone]}`}>{value}</p>
        </div>
        {Icon && (
          <span className="icon-tile">
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
      </div>

      {clamped !== undefined && (
        <div className="mt-3 h-1 rounded-full bg-surface-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${TONE_FILL[tone]}`}
            style={{ width: `${clamped * 100}%` }}
          />
        </div>
      )}

      {hint && <p className="mt-2 text-sm text-ink-faint">{hint}</p>}
    </div>
  );
}
