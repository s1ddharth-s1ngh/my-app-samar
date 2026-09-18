import { type ReactNode, useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/cn';
import { CARD_METRIC } from '@/lib/surfaces';

const BRAND = '#1E6FFF';

export interface MetricSub {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}

const SUB_TONE = {
  default: 'text-white',
  good: 'text-emerald-300',
  warn: 'text-amber-300',
  bad: 'text-red-300',
} as const;

export interface MetricCardProps {
  label: string;
  /** The headline figure, already formatted. */
  value: ReactNode;
  /** Change against the comparison period. `null` when there is nothing to compare. */
  delta?: number | null;
  deltaSuffix?: string;
  deltaUnit?: '%' | 'pp';
  chartData?: Record<string, number | string>[];
  chartKey?: string;
  chartColor?: string;
  /** Up to four related figures under a hairline. */
  subs?: MetricSub[];
  /** Raises the border to amber: something in this card needs attention. */
  alert?: boolean;
  className?: string;
}

/**
 * A structured metric: the primary figure with its change, an optional
 * sparkline, and a row of related numbers. One card tells one story — it
 * replaces four single-number tiles.
 */
export function MetricCard({
  label,
  value,
  delta,
  deltaSuffix,
  deltaUnit = '%',
  chartData,
  chartKey,
  chartColor = BRAND,
  subs,
  alert = false,
  className,
}: MetricCardProps) {
  const hasChart = Boolean(chartData && chartKey && chartData.length > 1);

  return (
    <div className={cn(CARD_METRIC, alert ? 'border-amber-500/25' : '', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-[0.07em] text-white/45 uppercase">
            {label}
          </div>
          <div
            data-numeric=""
            className="mt-1 text-[28px] leading-none font-bold text-white tabular-nums"
          >
            {value}
          </div>
        </div>
        {delta != null && <DeltaPill delta={delta} suffix={deltaSuffix} unit={deltaUnit} />}
      </div>

      {hasChart && (
        <div className="-mx-1 mt-2">
          <MiniArea data={chartData!} dataKey={chartKey!} color={chartColor} />
        </div>
      )}

      {subs && subs.length > 0 && (
        <div
          className={cn(
            'mt-3 grid gap-2 border-t border-white/[0.06] pt-3',
            !hasChart && 'mt-auto'
          )}
          style={{ gridTemplateColumns: `repeat(${subs.length}, minmax(0, 1fr))` }}
        >
          {subs.map((sub) => (
            <div key={sub.label} className="min-w-0">
              <div className="truncate text-[9.5px] font-medium tracking-[0.05em] text-white/35 uppercase">
                {sub.label}
              </div>
              <div
                data-numeric=""
                className={cn(
                  'mt-0.5 truncate text-[14px] font-semibold tabular-nums',
                  SUB_TONE[sub.tone ?? 'default']
                )}
              >
                {sub.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DeltaPill({
  delta,
  suffix,
  unit = '%',
}: {
  delta: number;
  suffix?: string;
  unit?: '%' | 'pp';
}) {
  const up = delta >= 0;
  return (
    <span
      className={cn(
        'inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-semibold tabular-nums',
        up ? 'bg-emerald-500/12 text-emerald-300' : 'bg-red-500/12 text-red-300'
      )}
    >
      {up ? '↑' : '↓'}
      {unit === 'pp' ? `${delta.toFixed(1)}pp` : `${Math.abs(delta).toFixed(0)}%`}
      {suffix && <span className="font-normal opacity-70">{suffix}</span>}
    </span>
  );
}

/** Sparkline for the inside of a metric card. */
function MiniArea({
  data,
  dataKey,
  color,
  height = 52,
}: {
  data: Record<string, number | string>[];
  dataKey: string;
  color: string;
  height?: number;
}) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
