import { cn } from '@/lib/cn';
import { MICRO_LABEL } from '@/lib/surfaces';
import { WEEKDAY_LABELS } from '@/domain/schedule';
import { TAB_PILLS_CONTAINER, TAB_PILL_ACTIVE, TAB_PILL_INACTIVE, TAB_PILL_ITEM } from './TabPills';

export interface WeekdayPickerProps {
  label: string;
  /** ISO weekdays, 1 = Monday to 7 = Sunday. */
  value: number[];
  onChange: (days: number[]) => void;
  error?: string;
  helpText?: string;
}

/**
 * Pick the days of the week. The same segmented look as `TabPills`, but every
 * item toggles on its own: this is a multiple choice, not a view switch.
 */
export function WeekdayPicker({ label, value, onChange, error, helpText }: WeekdayPickerProps) {
  const toggle = (day: number) =>
    onChange(
      value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b)
    );

  return (
    <div className="space-y-1.5">
      <span className={cn(MICRO_LABEL, 'block')}>{label}</span>
      <div className={cn(TAB_PILLS_CONTAINER, 'w-full justify-between')}>
        {WEEKDAY_LABELS.map((dayLabel, index) => {
          const day = index + 1;
          const active = value.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(day)}
              className={cn(
                TAB_PILL_ITEM,
                'flex-1 justify-center px-0',
                active ? TAB_PILL_ACTIVE : TAB_PILL_INACTIVE
              )}
            >
              {dayLabel}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="text-[11px] text-bad">{error}</p>
      ) : helpText ? (
        <p className="text-[11px] text-muted-foreground">{helpText}</p>
      ) : null}
    </div>
  );
}
