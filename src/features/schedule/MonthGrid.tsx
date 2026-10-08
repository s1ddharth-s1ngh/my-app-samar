import { cn } from '@/lib/cn';
import { todayCalendarDate } from '@/domain/cycles';
import { WEEKDAY_LABELS, blocksForDate, monthGridDates, sameMonth } from '@/domain/schedule';
import type { CalendarDate, ScheduleBlock } from '@/data/types';
import { SCHEDULE_KINDS } from './kinds';

/** Chips that fit a cell before it has to say "+N". */
const MAX_CHIPS = 3;

export interface MonthGridProps {
  /** Any date of the month to draw. */
  date: CalendarDate;
  blocks: ScheduleBlock[];
  onPickDate: (date: CalendarDate) => void;
  onSelect: (block: ScheduleBlock) => void;
}

/**
 * The month as six fixed rows, so the grid never jumps height between months.
 * A cell lists what happens, not when — the hour belongs to the day view, and
 * cramming times in here only makes both unreadable.
 */
export function MonthGrid({ date, blocks, onPickDate, onSelect }: MonthGridProps) {
  const today = todayCalendarDate();
  const cells = monthGridDates(date);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-7 pb-1">
          {WEEKDAY_LABELS.map((label) => (
            <span
              key={label}
              className="px-1 text-[9.5px] font-semibold tracking-[0.07em] text-white/30 uppercase"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-white/[0.05]">
          {cells.map((cell) => {
            const dayBlocks = blocksForDate(blocks, cell);
            const isToday = cell === today;
            const inMonth = sameMonth(cell, date);

            return (
              <div
                key={cell}
                className={cn(
                  'min-h-[96px] border-t border-l border-white/[0.04] p-1',
                  'nth-[7n+1]:border-l-0',
                  !inMonth && 'bg-white/[0.012]'
                )}
              >
                <button
                  type="button"
                  onClick={() => onPickDate(cell)}
                  aria-label={`Apri il ${cell}`}
                  className={cn(
                    'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5',
                    'text-[11px] font-semibold tabular-nums transition-colors',
                    isToday
                      ? 'bg-brand text-white'
                      : inMonth
                        ? 'text-white/70 hover:bg-white/[0.07] hover:text-white'
                        : 'text-white/25 hover:bg-white/[0.05]'
                  )}
                >
                  {Number(cell.slice(8))}
                </button>

                <div className="mt-1 space-y-0.5">
                  {dayBlocks.slice(0, MAX_CHIPS).map((block) => {
                    const kind = SCHEDULE_KINDS[block.kind];
                    return (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => onSelect(block)}
                        aria-label={`${block.title}, ${block.start}. Modifica.`}
                        className={cn(
                          'flex w-full items-center gap-1 rounded-md px-1 py-0.5 text-left',
                          'transition-colors hover:bg-white/[0.06]',
                          kind.fill
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn('h-2.5 w-0.5 shrink-0 rounded-full', kind.rail)}
                        />
                        <span className="min-w-0 flex-1 truncate text-[10px] text-white/80">
                          {block.title}
                        </span>
                        <span className="shrink-0 text-[9px] text-white/35 tabular-nums">
                          {block.start}
                        </span>
                      </button>
                    );
                  })}

                  {dayBlocks.length > MAX_CHIPS && (
                    <button
                      type="button"
                      onClick={() => onPickDate(cell)}
                      className="px-1 text-[9.5px] text-white/35 transition-colors hover:text-white/70"
                    >
                      +{dayBlocks.length - MAX_CHIPS} altri
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
