import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * THE row of buttons under a page title. A dark segmented control: pill
 * container with a hairline, the selected item in brand green.
 *
 * There is no alternative: every top-level row of choices — page tabs, view
 * switches, dashboard sections — uses this. Change the look here and it changes
 * everywhere; do not hand-roll a second one in a page.
 */
export const TAB_PILLS_CONTAINER =
  'flex items-center gap-0.5 p-0.5 rounded-full bg-foreground/[0.04] border border-border';
export const TAB_PILL_ITEM =
  'touch-tab shrink-0 h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap';
export const TAB_PILL_ACTIVE = 'bg-brand text-on-brand';
export const TAB_PILL_INACTIVE = 'text-muted-foreground hover:text-secondary';

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
  const groupId = useId();
  const reduceMotion = useReducedMotion();
  return (
    <LayoutGroup id={groupId}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          TAB_PILLS_CONTAINER,
          // On a phone the row scrolls sideways instead of blowing up the layout.
          'scrollbar-hide max-w-full flex-nowrap overflow-x-auto',
          'sm:inline-flex',
          className
        )}
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => {
                const target =
                  event.key === 'ArrowRight'
                    ? (index + 1) % items.length
                    : event.key === 'ArrowLeft'
                      ? (index - 1 + items.length) % items.length
                      : event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? items.length - 1
                          : null;
                if (target === null) return;
                event.preventDefault();
                const button =
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                    '[role="tab"]'
                  )[target];
                button?.focus({ preventScroll: true });
                button?.scrollIntoView?.({
                  block: 'nearest',
                  inline: 'nearest',
                  behavior: reduceMotion ? 'instant' : 'smooth',
                });
                onChange(items[target]!.id);
              }}
              className={cn(
                TAB_PILL_ITEM,
                'relative isolate',
                active ? 'text-on-brand' : TAB_PILL_INACTIVE
              )}
            >
              {active && (
                <motion.span
                  data-tab-indicator=""
                  layoutId="selected-pill"
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-brand"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 480, damping: 28, mass: 0.8 }
                  }
                />
              )}
              {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>{item.label}</span>
              {typeof item.count === 'number' && (
                <span
                  className={cn(
                    'inline-flex h-[16px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums',
                    active
                      ? 'bg-white/20 text-on-brand'
                      : 'bg-foreground/[0.06] text-muted-foreground'
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
