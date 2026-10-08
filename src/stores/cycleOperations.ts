import { useDataStore } from './useDataStore';
import { useToastStore } from './toast';
import { computeAllocations } from '@/domain/allocation';
import {
  bucketCarriesOver,
  computeCarryOver,
  describeCycle,
  nextCycleBounds,
  type CarryOverSummary,
  type CycleBounds,
} from '@/domain/cycles';
import { newBase, nowInstant } from '@/lib/record';
import type { Cents, Cycle, ID } from '@/data/types';

/**
 * Multi-step cycle operations. They compose the CRUD actions of the data store
 * so components never reach the persistence layer themselves; all the rules
 * they apply come from `src/domain`.
 */

/** Everything a bucket did in a cycle, ready for the closing summary. */
export interface CycleCloseSummary {
  cycle: Cycle;
  rows: {
    bucketId: ID;
    name: string;
    planned: Cents;
    spent: Cents;
    leftover: Cents;
    carries: boolean;
  }[];
  carryOver: CarryOverSummary;
  nextBounds: CycleBounds;
  nextLabel: string;
}

function activeSettings() {
  const settings = useDataStore.getState().settings;
  return {
    cycleMode: settings?.cycleMode ?? 'calendarMonth',
    paydayAnchor: settings?.paydayAnchor ?? 1,
  } as const;
}

/**
 * Recomputes every unlocked allocation of a cycle from its income, and refreshes
 * `actualAmount` from the transactions actually recorded.
 */
export async function syncAllocations(cycleId: ID): Promise<void> {
  const state = useDataStore.getState();
  const cycle = state.cycles.find((item) => item.id === cycleId && !item.deletedAt);
  if (!cycle) return;

  const totalIncome =
    cycle.openingBalance +
    state.incomeEntries
      .filter((entry) => entry.cycleId === cycleId && !entry.deletedAt)
      .reduce((acc, entry) => acc + entry.amount, 0);

  const buckets = state.buckets.filter((bucket) => bucket.isActive && !bucket.deletedAt);
  const existing = state.allocations.filter((item) => item.cycleId === cycleId && !item.deletedAt);

  const locked = existing
    .filter((item) => item.isLocked)
    .map((item) => ({ bucketId: item.bucketId, amount: item.plannedAmount }));

  const result = computeAllocations({ totalIncome, buckets, locked });

  for (const line of result.lines) {
    const actualAmount = state.transactions
      .filter(
        (item) =>
          item.cycleId === cycleId &&
          item.bucketId === line.bucketId &&
          item.type === 'expense' &&
          !item.deletedAt
      )
      .reduce((acc, item) => acc + item.amount, 0);

    const current = existing.find((item) => item.bucketId === line.bucketId);

    if (!current) {
      await state.createItem('allocations', {
        ...newBase(),
        cycleId,
        bucketId: line.bucketId,
        plannedAmount: line.plannedAmount,
        actualAmount,
        isLocked: false,
      });
      continue;
    }

    const plannedAmount = current.isLocked ? current.plannedAmount : line.plannedAmount;
    if (current.plannedAmount !== plannedAmount || current.actualAmount !== actualAmount) {
      await state.updateItem('allocations', current.id, {
        plannedAmount,
        actualAmount,
        updatedAt: nowInstant(),
      });
    }
  }

  // Buckets that no longer exist should not keep an allocation around.
  const liveBucketIds = new Set(result.lines.map((line) => line.bucketId));
  for (const allocation of existing) {
    if (!liveBucketIds.has(allocation.bucketId)) {
      await state.removeItem('allocations', allocation.id);
    }
  }
}

/**
 * Recomputes the open cycle, if there is one. Buckets and their rules decide
 * the split, so every write to them has to end here — otherwise the numbers on
 * screen keep describing the rules as they were.
 */
export async function syncActiveCycle(): Promise<void> {
  const active = useDataStore
    .getState()
    .cycles.find((cycle) => cycle.status === 'active' && !cycle.deletedAt);
  if (active) await syncAllocations(active.id);
}

export async function openCycle(params: {
  bounds: CycleBounds;
  label: string;
  openingBalance?: Cents;
}): Promise<ID | null> {
  const state = useDataStore.getState();

  // Idempotent: a cycle with the same boundaries is never created twice.
  const already = state.cycles.find(
    (item) =>
      !item.deletedAt &&
      item.startDate === params.bounds.startDate &&
      item.endDate === params.bounds.endDate
  );
  if (already) {
    if (already.status !== 'active') {
      await state.updateItem('cycles', already.id, { status: 'active', updatedAt: nowInstant() });
    }
    await syncAllocations(already.id);
    return already.id;
  }

  const cycle = {
    ...newBase(),
    label: params.label,
    startDate: params.bounds.startDate,
    endDate: params.bounds.endDate,
    status: 'active' as const,
    openingBalance: params.openingBalance ?? 0,
    closedAt: null,
  };

  await state.createItem('cycles', cycle);
  await syncAllocations(cycle.id);
  return cycle.id;
}

/** The numbers the user confirms before a cycle is closed. Pure read, no writes. */
export function buildCloseSummary(cycleId: ID): CycleCloseSummary | null {
  const state = useDataStore.getState();
  const cycle = state.cycles.find((item) => item.id === cycleId && !item.deletedAt);
  if (!cycle) return null;

  const allocations = state.allocations.filter(
    (item) => item.cycleId === cycleId && !item.deletedAt
  );

  const rows = allocations.map((allocation) => {
    const bucket = state.buckets.find((item) => item.id === allocation.bucketId);
    const spent = state.transactions
      .filter(
        (item) =>
          item.cycleId === cycleId &&
          item.bucketId === allocation.bucketId &&
          item.type === 'expense' &&
          !item.deletedAt
      )
      .reduce((acc, item) => acc + item.amount, 0);

    return {
      bucketId: allocation.bucketId,
      name: bucket?.name ?? 'Bucket rimosso',
      planned: allocation.plannedAmount,
      spent,
      leftover: allocation.plannedAmount - spent,
      carries: bucket ? bucketCarriesOver(bucket.kind) : true,
    };
  });

  const carryOver = computeCarryOver(
    rows.map((row) => ({
      bucketId: row.bucketId,
      planned: row.planned,
      spent: row.spent,
      carriesOver: row.carries,
    }))
  );

  const settings = activeSettings();
  const nextBounds = nextCycleBounds(
    { startDate: cycle.startDate, endDate: cycle.endDate },
    settings.cycleMode,
    settings.paydayAnchor
  );

  return {
    cycle,
    rows,
    carryOver,
    nextBounds,
    nextLabel: describeCycle(nextBounds, settings.cycleMode),
  };
}

/**
 * Closes a cycle and opens the next one with the carry-over as its opening
 * balance. Running it twice on an already closed cycle changes nothing.
 */
export async function closeCycleAndOpenNext(cycleId: ID): Promise<ID | null> {
  const summary = buildCloseSummary(cycleId);
  if (!summary) return null;

  const state = useDataStore.getState();

  if (summary.cycle.status !== 'closed') {
    await state.updateItem('cycles', cycleId, {
      status: 'closed',
      closedAt: nowInstant(),
      updatedAt: nowInstant(),
    });
  }

  const nextId = await openCycle({
    bounds: summary.nextBounds,
    label: summary.nextLabel,
    openingBalance: summary.carryOver.openingBalance,
  });

  useToastStore.getState().addToast(`Ciclo chiuso. Hai aperto ${summary.nextLabel}.`, 'success');

  return nextId;
}
