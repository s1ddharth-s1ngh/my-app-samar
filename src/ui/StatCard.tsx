import { type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CARD } from '@/lib/surfaces';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  /** 0–1. Renders the thin rail under the figure. */
  progress?: number;
  /** Colour is information: only a real state earns one. */
  tone?: 'neutral' | 'brand' | 'good' | 'warn' | 'bad';
  className?: string;
}

const TONE_TEXT = {
  neutral: 'text-white',
  brand: 'text-[#67a8f3]',
  good: 'text-emerald-300',
  warn: 'text-amber-300',
  bad: 'text-red-300',
} as const;

const TONE_FILL = {
  neutral: 'bg-white/30',
  brand: 'bg-[#1E6FFF]',
  good: 'bg-emerald-400',
  warn: 'bg-amber-400',
  bad: 'bg-red-400',
} as const;

/**
 * The plain figure tile: a micro label, one number, optionally a rail and a
 * line of context. For the richer story — change, sparkline, sub-metrics — use
 * `MetricCard` instead.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  progress,
  tone = 'neutral',
  className,
}: StatCardProps) {
  const clamped = progress === undefined ? undefined : Math.min(1, Math.max(0, progress));

  return (
    <div className={cn(CARD, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9.5px] font-semibold tracking-[0.07em] text-white/30 uppercase">
            {label}
          </p>
          <p
            data-numeric=""
            className={cn('mt-1 truncate text-[20px] leading-none font-bold', TONE_TEXT[tone])}
          >
            {value}
          </p>
        </div>
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/50">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>

      {clamped !== undefined && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none',
              TONE_FILL[tone]
            )}
            style={{ width: `${clamped * 100}%` }}
          />
        </div>
      )}

      {hint && <p className="mt-2 text-[10.5px] text-white/35">{hint}</p>}
    </div>
  );
}
