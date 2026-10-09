import { cn } from '@/lib/cn';
import { todayCalendarDate } from '@/domain/cycles';
import { blocksForDate, monthGridDates, monthsOfYear, sameMonth } from '@/domain/schedule';
import type { CalendarDate, ScheduleBlock } from '@/data/types';

const MONTH_NAME = new Intl.DateTimeFormat('it-IT', { month: 'long' });

/** How full a day looks. Four steps is all the eye reads at this size. */
function density(count: number): string {
  if (count === 0) return 'text-muted-foreground';
  if (count === 1) return 'bg-brand/20 text-secondary';
  if (count === 2) return 'bg-selected text-selected-foreground';
  return 'bg-brand text-on-brand';
}

export interface YearGridProps {
  /** Any date of the year to draw. */
  date: CalendarDate;
  blocks: ScheduleBlock[];
  onPickDate: (date: CalendarDate) => void;
  onPickMonth: (date: CalendarDate) => void;
}

/**
 * Twelve months at a glance. A year cannot show what happens, only how full a
 * day is — so each day is one square shaded by how many blocks it holds, and
 * the detail lives one click away.
 */
export function YearGrid({ date, blocks, onPickDate, onPickMonth }: YearGridProps) {
  const today = todayCalendarDate();

  return (
    <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {monthsOfYear(date).map((month) => (
        <div key={month}>
          <button
            type="button"
            onClick={() => onPickMonth(month)}
            className="mb-1.5 text-[11px] font-semibold text-secondary capitalize transition-colors hover:text-foreground"
          >
            {MONTH_NAME.format(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1))}
          </button>

          <div className="grid grid-cols-7 gap-px">
            {monthGridDates(month).map((cell) => {
              if (!sameMonth(cell, month)) {
                return <span key={cell} aria-hidden="true" className="aspect-square" />;
              }

              const count = blocksForDate(blocks, cell).length;
              const isToday = cell === today;

              return (
                <button
                  key={cell}
                  type="button"
                  onClick={() => onPickDate(cell)}
                  aria-label={`${cell}, ${count} blocchi`}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-[4px]',
                    'text-[11px] font-medium tabular-nums transition-colors hover:ring-1 hover:ring-brand-soft',
                    density(count),
                    isToday && 'ring-1 ring-brand-soft'
                  )}
                >
                  {Number(cell.slice(8))}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
