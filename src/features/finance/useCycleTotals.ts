import { useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import type { Cents, Cycle } from '@/data/types';

export interface CycleTotals {
  cycle: Cycle | null;
  /** Everything registered as income on the cycle, expected or received. */
  income: Cents;
  /** Only what has actually landed. */
  incomeReceived: Cents;
  /** What the allocation engine put aside across the buckets. */
  allocated: Cents;
  /** What left the buckets as transactions. */
  spent: Cents;
  available: Cents;
}

/**
 * The four numbers that describe a cycle at a glance. Summing only — the rules
 * about what counts as committed live in the domain layer.
 */
export function useCycleTotals(): CycleTotals {
  const cycles = useDataStore((state) => state.cycles);
  const incomeEntries = useDataStore((state) => state.incomeEntries);
  const allocations = useDataStore((state) => state.allocations);
  const transactions = useDataStore((state) => state.transactions);

  return useMemo(() => {
    const cycle = cycles.find((item) => item.status === 'active' && !item.deletedAt) ?? null;

    if (!cycle) {
      return {
        cycle: null,
        income: 0,
        incomeReceived: 0,
        allocated: 0,
        spent: 0,
        available: 0,
      };
    }

    const entries = incomeEntries.filter((entry) => entry.cycleId === cycle.id && !entry.deletedAt);
    const income = entries.reduce((acc, entry) => acc + entry.amount, 0) + cycle.openingBalance;
    const incomeReceived =
      entries
        .filter((entry) => entry.status === 'received')
        .reduce((acc, entry) => acc + entry.amount, 0) + cycle.openingBalance;

    const allocated = allocations
      .filter((item) => item.cycleId === cycle.id && !item.deletedAt)
      .reduce((acc, item) => acc + item.plannedAmount, 0);

    const spent = transactions
      .filter((item) => item.cycleId === cycle.id && !item.deletedAt && item.type === 'expense')
      .reduce((acc, item) => acc + item.amount, 0);

    return { cycle, income, incomeReceived, allocated, spent, available: allocated - spent };
  }, [cycles, incomeEntries, allocations, transactions]);
}
