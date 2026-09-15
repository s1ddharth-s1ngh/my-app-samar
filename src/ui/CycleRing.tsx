import { type SVGProps, useEffect, useState } from 'react';

export interface CycleRingBucket {
  id: string;
  color: string;
  amount: number;
}

export interface CycleRingProps extends SVGProps<SVGSVGElement> {
  daysTotal: number;
  daysPassed: number;
  totalBudget: number;
  buckets: CycleRingBucket[];
}

export function CycleRing({
  daysTotal,
  daysPassed,
  totalBudget,
  buckets,
  className = '',
  ...props
}: CycleRingProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const size = 200;
  const center = size / 2;
  const strokeWidth = 16;
  const outerRadius = center - strokeWidth / 2;
  const innerRadius = outerRadius - strokeWidth - 4; // 4px gap

  const calculateDashArray = (radius: number, percent: number) => {
    const circumference = 2 * Math.PI * radius;
    const dash = (percent / 100) * circumference;
    const gap = circumference - dash;
    return `${dash} ${gap}`;
  };

  const calculateOffset = (radius: number, startPercent: number) => {
    const circumference = 2 * Math.PI * radius;
    // -90 degrees is the top (-0.25 offset essentially, handled by rotate)
    return -((startPercent / 100) * circumference);
  };

  const daysPercent = daysTotal > 0 ? Math.min((daysPassed / daysTotal) * 100, 100) : 0;
  const bucketSegments = [];
  let currentPercent = 0;

  for (const b of buckets) {
    const percent = totalBudget > 0 ? (b.amount / totalBudget) * 100 : 0;
    if (percent > 0) {
      bucketSegments.push({
        ...b,
        percent,
        startPercent: currentPercent,
      });
      currentPercent += percent;
    }
  }

  const ariaLabel = `Ciclo: ${daysPassed} giorni su ${daysTotal} trascorsi. Budget suddiviso in ${bucketSegments.length} categorie.`;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
      className={`transform -rotate-90 ${className}`}
      {...props}
    >
      {/* Sfondo giorni */}
      <circle
        cx={center}
        cy={center}
        r={outerRadius}
        fill="transparent"
        stroke="currentColor"
        className="text-zinc-100 dark:text-zinc-800"
        strokeWidth={strokeWidth}
      />
      {/* Progresso giorni */}
      <circle
        cx={center}
        cy={center}
        r={outerRadius}
        fill="transparent"
        stroke="currentColor"
        className="text-zinc-400 dark:text-zinc-500 transition-all duration-1000 ease-out motion-reduce:transition-none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={calculateDashArray(outerRadius, isMounted ? daysPercent : 0)}
        strokeDashoffset={0}
      />

      {/* Sfondo budget (solo se ci sono bucket) */}
      {bucketSegments.length > 0 && (
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="transparent"
          stroke="currentColor"
          className="text-zinc-100 dark:text-zinc-800"
          strokeWidth={strokeWidth}
        />
      )}

      {/* Segmenti budget */}
      {bucketSegments.map((b) => (
        <circle
          key={b.id}
          cx={center}
          cy={center}
          r={innerRadius}
          fill="transparent"
          stroke={b.color}
          className="transition-all duration-1000 ease-out motion-reduce:transition-none"
          strokeWidth={strokeWidth}
          strokeDasharray={calculateDashArray(innerRadius, isMounted ? b.percent : 0)}
          strokeDashoffset={calculateOffset(innerRadius, isMounted ? b.startPercent : 0)}
        />
      ))}
    </svg>
  );
}
