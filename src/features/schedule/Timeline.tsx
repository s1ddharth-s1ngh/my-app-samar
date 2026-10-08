import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { parseCalendarDate, todayCalendarDate } from '@/domain/cycles';
import {
  blocksForDate,
  clockFromMinutes,
  dayWindow,
  layoutDay,
  minutesOfDay,
} from '@/domain/schedule';
import type { CalendarDate, ScheduleBlock } from '@/data/types';
import { SCHEDULE_KINDS } from './kinds';

/** One hour of the day, in pixels. The whole geometry derives from this. */
const HOUR_HEIGHT = 56;
/** A click on empty space lands on the nearest half hour. */
const SNAP_MINUTES = 30;

const DAY_NAME = new Intl.DateTimeFormat('it-IT', { weekday: 'short' });

export interface TimelineProps {
  /** One date draws a day, seven draw a week. The grid is the same either way. */
  dates: CalendarDate[];
  /** Every row of the agenda: each column resolves its own day. */
  blocks: ScheduleBlock[];
  onSelect: (block: ScheduleBlock) => void;
  /** Clicking empty space opens a new block starting there. */
  onCreate: (date: CalendarDate, start: string, end: string) => void;
  /** Clicking a column heading, in the week view. */
  onPickDate?: (date: CalendarDate) => void;
}

/** Minutes since midnight, refreshed each minute. */
function useNowMinutes(): number {
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

  return minutes;
}

/**
 * The hour grid, for one day or for a week. Blocks that overlap in time sit
 * side by side rather than hiding each other — a lunch break lives inside the
 * work block, and both have to stay clickable.
 */
export function Timeline({ dates, blocks, onSelect, onCreate, onPickDate }: TimelineProps) {
  const nowMinutes = useNowMinutes();
  const today = todayCalendarDate();

  const perDay = dates.map((date) => ({ date, blocks: blocksForDate(blocks, date) }));
  const { fromHour, toHour } = dayWindow(perDay.flatMap((day) => day.blocks));

  const hours = Array.from({ length: toHour - fromHour }, (_, index) => fromHour + index);
  const offset = (minutes: number) => ((minutes - fromHour * 60) / 60) * HOUR_HEIGHT;
  const totalHeight = (toHour - fromHour) * HOUR_HEIGHT;

  const showNow = nowMinutes >= fromHour * 60 && nowMinutes <= toHour * 60;
  const isWeek = dates.length > 1;

  const handleBackgroundClick = (date: CalendarDate, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const raw = fromHour * 60 + ((event.clientY - rect.top) / HOUR_HEIGHT) * 60;
    const start = Math.max(0, Math.min(23 * 60, Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES));
    onCreate(date, clockFromMinutes(start), clockFromMinutes(start + 60));
  };

  return (
    <div className="overflow-x-auto">
      <div className={cn('min-w-full', isWeek && 'min-w-[640px]')}>
        {isWeek && (
          <div className="flex pb-2">
            <div className="w-11 shrink-0" />
            {perDay.map(({ date, blocks: dayBlocks }) => {
              const isToday = date === today;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => onPickDate?.(date)}
                  className={cn(
                    'flex-1 rounded-xl px-1 py-1 text-center transition-colors',
                    'hover:bg-white/[0.04]'
                  )}
                >
                  <span className="block text-[9.5px] font-semibold tracking-[0.07em] text-white/30 uppercase">
                    {DAY_NAME.format(parseCalendarDate(date)).replace('.', '')}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-semibold tabular-nums',
                      isToday ? 'bg-brand text-white' : 'text-white/70'
                    )}
                  >
                    {Number(date.slice(8))}
                  </span>
                  <span className="mt-0.5 block text-[9.5px] text-white/25 tabular-nums">
                    {dayBlocks.length === 0 ? '—' : dayBlocks.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex" style={{ height: totalHeight }}>
          <div className="w-11 shrink-0">
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

          {perDay.map(({ date, blocks: dayBlocks }) => (
            <div
              key={date}
              onClick={(event) => handleBackgroundClick(date, event)}
              className={cn(
                'relative flex-1 cursor-copy',
                isWeek && 'border-l border-white/[0.04] first:border-l-0'
              )}
            >
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

              {layoutDay(dayBlocks).map(({ block, lane, lanes }) => {
                const kind = SCHEDULE_KINDS[block.kind];
                const start = minutesOfDay(block.start);
                const end = minutesOfDay(block.end);
                const isShort = end - start < 45;

                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(block);
                    }}
                    aria-label={`${block.title}, dalle ${block.start} alle ${block.end}. Modifica.`}
                    className={cn(
                      'absolute cursor-pointer overflow-hidden rounded-xl border border-white/[0.06] px-2 py-1 text-left',
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
                    {!isShort && !isWeek && (
                      <span className={cn('ml-1.5 block text-[10px] tabular-nums', kind.text)}>
                        {block.start}–{block.end}
                      </span>
                    )}
                  </button>
                );
              })}

              {showNow && date === today && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                  style={{ top: offset(nowMinutes) }}
                  aria-label={`Ora: ${clockFromMinutes(nowMinutes)}`}
                >
                  <span className="bg-brand -ml-0.5 h-1.5 w-1.5 rounded-full" />
                  <span className="bg-brand/60 h-px flex-1" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
