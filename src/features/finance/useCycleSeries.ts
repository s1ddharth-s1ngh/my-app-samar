import { useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import type { Cents, Cycle } from '@/data/types';

export interface CyclePoint {
  id: string;
  label: string;
  /** Short label for a chart axis. */
  short: string;
  income: Cents;
  spent: Cents;
  saved: Cents;
}

export interface CycleSeries {
  points: CyclePoint[];
  current: CyclePoint | null;
  previous: CyclePoint | null;
  cycle: Cycle | null;
}

/** Percentage change, or `null` when there is nothing honest to compare against. */
export function deltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Income and spend per cycle, oldest first — the spine of every figure on the
 * money cockpit, and the series behind its sparklines.
 */
export function useCycleSeries(): CycleSeries {
  const cycles = useDataStore((state) => state.cycles);
  const incomeEntries = useDataStore((state) => state.incomeEntries);
  const transactions = useDataStore((state) => state.transactions);

  return useMemo(() => {
    const ordered = cycles
      .filter((cycle) => !cycle.deletedAt)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    const points: CyclePoint[] = ordered.map((cycle) => {
      const income =
        cycle.openingBalance +
        incomeEntries
          .filter((entry) => entry.cycleId === cycle.id && !entry.deletedAt)
          .reduce((acc, entry) => acc + entry.amount, 0);

      const spent = transactions
        .filter((item) => item.cycleId === cycle.id && item.type === 'expense' && !item.deletedAt)
        .reduce((acc, item) => acc + item.amount, 0);

      return {
        id: cycle.id,
        label: cycle.label,
        short: cycle.label.split(' ')[0] ?? cycle.label,
        income,
        spent,
        saved: income - spent,
      };
    });

    const active = ordered.find((cycle) => cycle.status === 'active') ?? null;
    const activeIndex = active ? ordered.findIndex((cycle) => cycle.id === active.id) : -1;

    return {
      points,
      cycle: active,
      current: activeIndex >= 0 ? (points[activeIndex] ?? null) : null,
      previous: activeIndex > 0 ? (points[activeIndex - 1] ?? null) : null,
    };
  }, [cycles, incomeEntries, transactions]);
}
