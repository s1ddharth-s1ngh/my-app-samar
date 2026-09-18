import { useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedOption {
  value: string;
  label: ReactNode;
  /** Used for the accessible name when `label` is an icon. */
  title?: string;
}

export interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  /** Icon-only segments are square; text segments share the row evenly. */
  compact?: boolean;
  className?: string;
}

/**
 * A capsule with a glass pill that slides under the active label.
 *
 * The segments are a grid of equal columns, so the pill — one column wide —
 * travels by exact multiples of its own width. Only the transform animates;
 * the labels change colour on their own.
 */
export function Segmented({
  options,
  value,
  onChange,
  ariaLabel,
  compact = false,
  className,
}: SegmentedProps) {
  const groupId = useId();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  const move = (delta: number) => {
    const next = (activeIndex + delta + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    buttonsRef.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'relative grid h-9 items-center rounded-full border border-border bg-muted/50 p-1',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          move(1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      {/* The sliding pill. Its width is one column, so a translate of
          `index * 100%` lands it exactly on the active segment. */}
      <span
        aria-hidden="true"
        className="glass-control pointer-events-none absolute left-1 top-1/2 h-7 rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%) translateY(-50%)`,
        }}
      />

      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.title}
            title={option.title}
            tabIndex={isActive ? 0 : -1}
            id={`${groupId}-${option.value}`}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 flex h-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
              compact ? 'px-0' : 'px-2',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
