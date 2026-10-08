import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { todayCalendarDate } from '@/domain/cycles';
import { clockFromMinutes, dayWindow, layoutDay, minutesOfDay } from '@/domain/schedule';
import type { CalendarDate, ScheduleBlock } from '@/data/types';
import { SCHEDULE_KINDS } from './kinds';

/** One hour of the day, in pixels. The whole geometry derives from this. */
const HOUR_HEIGHT = 56;
const GUTTER = 'w-11 shrink-0';

export interface DayTimelineProps {
  date: CalendarDate;
  /** Already resolved for this date — see `blocksForDate`. */
  blocks: ScheduleBlock[];
  onSelect: (block: ScheduleBlock) => void;
}

/** Minutes since midnight, refreshed each minute, or null off today. */
function useNowMinutes(date: CalendarDate): number | null {
  const [minutes, setMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return date === todayCalendarDate() ? minutes : null;
}

/**
 * The day drawn to scale. Blocks that overlap in time sit side by side rather
 * than hiding each other — a lunch break lives inside the work block, and both
 * have to stay clickable.
 */
export function DayTimeline({ date, blocks, onSelect }: DayTimelineProps) {
  const { fromHour, toHour } = dayWindow(blocks);
  const nowMinutes = useNowMinutes(date);

  const hours = Array.from({ length: toHour - fromHour }, (_, index) => fromHour + index);
  const offset = (minutes: number) => ((minutes - fromHour * 60) / 60) * HOUR_HEIGHT;
  const totalHeight = (toHour - fromHour) * HOUR_HEIGHT;

  const showNow = nowMinutes !== null && nowMinutes >= fromHour * 60 && nowMinutes <= toHour * 60;

  return (
    <div className="flex" style={{ height: totalHeight }}>
      <div className={GUTTER}>
        {hours.map((hour) => (
          <div
            key={hour}
            className="relative text-[9.5px] font-semibold text-white/30 tabular-nums"
            style={{ height: HOUR_HEIGHT }}
          >
            <span className="absolute -top-1.5 right-2">{String(hour).padStart(2, '0')}</span>
          </div>
        ))}
      </div>

      <div className="relative flex-1">
        {/* The hour rules sit behind everything and are decoration only. */}
        {hours.map((hour, index) => (
          <div
            key={hour}
            aria-hidden="true"
            className="absolute inset-x-0 border-t border-white/[0.05]"
            style={{ top: index * HOUR_HEIGHT }}
          />
        ))}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 border-t border-white/[0.05]"
          style={{ top: totalHeight }}
        />

        {layoutDay(blocks).map(({ block, lane, lanes }) => {
          const kind = SCHEDULE_KINDS[block.kind];
          const start = minutesOfDay(block.start);
          const end = minutesOfDay(block.end);
          const isShort = end - start < 45;

          return (
            <button
              key={block.id}
              type="button"
              onClick={() => onSelect(block)}
              aria-label={`${block.title}, dalle ${block.start} alle ${block.end}. Modifica.`}
              className={cn(
                'absolute overflow-hidden rounded-xl border border-white/[0.06] px-2 py-1 text-left',
                'transition-colors hover:border-white/20',
                kind.fill
              )}
              style={{
                top: offset(start) + 1,
                height: Math.max(offset(end) - offset(start) - 2, 18),
                left: `calc(${(lane / lanes) * 100}% + ${lane === 0 ? 0 : 2}px)`,
                width: `calc(${100 / lanes}% - 2px)`,
              }}
            >
              <span
                aria-hidden="true"
                className={cn('absolute inset-y-1 left-0 w-0.5 rounded-full', kind.rail)}
              />
              <span
                className={cn(
                  'ml-1.5 block truncate text-[11px] font-semibold text-white',
                  isShort && 'text-[10px]'
                )}
              >
                {block.title}
              </span>
              {!isShort && (
                <span className={cn('ml-1.5 block text-[10px] tabular-nums', kind.text)}>
                  {block.start}–{block.end}
                </span>
              )}
            </button>
          );
        })}

        {showNow && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
            style={{ top: offset(nowMinutes) }}
            aria-label={`Ora: ${clockFromMinutes(nowMinutes)}`}
          >
            <span className="h-1.5 w-1.5 -ml-0.5 rounded-full bg-[#1E6FFF]" />
            <span className="h-px flex-1 bg-[#1E6FFF]/60" />
          </div>
        )}
      </div>
    </div>
  );
}
