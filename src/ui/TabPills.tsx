import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * THE row of buttons under a page title. A dark segmented control: pill
 * container with a hairline, the selected item in brand blue.
 *
 * There is no alternative: every top-level row of choices — page tabs, view
 * switches, dashboard sections — uses this. Change the look here and it changes
 * everywhere; do not hand-roll a second one in a page.
 */
export const TAB_PILLS_CONTAINER =
  'flex items-center gap-0.5 p-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]';
export const TAB_PILL_ITEM =
  'shrink-0 h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap';
export const TAB_PILL_ACTIVE = 'bg-[#1E6FFF] text-white';
export const TAB_PILL_INACTIVE = 'text-white/45 hover:text-white/80';

export interface TabPillItem<T extends string = string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

export interface TabPillsProps<T extends string = string> {
  items: readonly TabPillItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function TabPills<T extends string = string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: TabPillsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        TAB_PILLS_CONTAINER,
        // On a phone the row scrolls sideways instead of blowing up the layout.
        'scrollbar-hide max-w-full flex-nowrap overflow-x-auto',
        'sm:inline-flex sm:max-w-none sm:overflow-visible',
        className
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(TAB_PILL_ITEM, active ? TAB_PILL_ACTIVE : TAB_PILL_INACTIVE)}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {item.label}
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'inline-flex h-[16px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums',
                  active ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-white/50'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
