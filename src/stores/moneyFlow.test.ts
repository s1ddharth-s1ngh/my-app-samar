import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDataStore } from './useDataStore';
import { openCycle, syncAllocations, syncActiveCycle } from './cycleOperations';
import { dbAdapter } from './db';
import { newBase } from '@/lib/record';
import { computeCycleBounds, describeCycle, todayCalendarDate } from '@/domain/cycles';
import type { AllocationRule, Bucket } from '@/data/types';

/**
 * The money area end to end, through the store rather than the pure engine:
 * open a cycle, register income, let the rules split it, spend, and watch the
 * bucket drain. If the wiring between screens, store and engine breaks, this
 * fails — the domain tests next door would not notice.
 */

function makeBucket(name: string, rule: AllocationRule, priority: number): Bucket {
  return {
    ...newBase(),
    name,
    kind: 'custom',
    rule,
    priority,
    targetAmount: null,
    color: '#10b981',
    icon: '🏠',
    isActive: true,
  };
}

const MODE = 'calendarMonth';

describe('flusso denaro', () => {
  beforeEach(async () => {
    await dbAdapter.init('money_flow_' + Date.now() + '_' + Math.random());
    useDataStore.setState({
      isHydrated: true,
      buckets: [],
      cycles: [],
      allocations: [],
      transactions: [],
      incomeEntries: [],
    });
  });

  it('apre un ciclo, ripartisce l’entrata e scala il bucket quando si spende', async () => {
    const { createItem } = useDataStore.getState();

    const affitto = makeBucket('Affitto', { type: 'fixed', value: 80000 }, 1);
    const risparmio = makeBucket(
      'Risparmio',
      { type: 'percent', value: 10, base: 'afterFixed' },
      2
    );
    const spese = makeBucket('Spese', { type: 'remainder' }, 3);
    for (const bucket of [affitto, risparmio, spese]) await createItem('buckets', bucket);

    const bounds = computeCycleBounds(todayCalendarDate(), MODE, 1);
    const cycleId = await openCycle({ bounds, label: describeCycle(bounds, MODE) });
    expect(cycleId).not.toBeNull();

    // Opened with no income: every bucket starts at zero rather than missing.
    expect(useDataStore.getState().allocations).toHaveLength(3);

    await createItem('incomeEntries', {
      ...newBase(),
      sourceId: crypto.randomUUID(),
      cycleId: cycleId!,
      amount: 200000,
      date: bounds.startDate,
      note: null,
      status: 'received',
    });
    await syncAllocations(cycleId!);

    const planned = (bucketId: string) =>
      useDataStore.getState().allocations.find((a) => a.bucketId === bucketId)?.plannedAmount ?? -1;

    expect(planned(affitto.id)).toBe(80000);
    expect(planned(risparmio.id)).toBe(12000); // 10% of the 120000 left after the fixed one
    expect(planned(spese.id)).toBe(108000);
    // Nothing created, nothing lost.
    expect(planned(affitto.id) + planned(risparmio.id) + planned(spese.id)).toBe(200000);

    await createItem('transactions', {
      ...newBase(),
      cycleId: cycleId!,
      bucketId: spese.id,
      type: 'expense',
      amount: 5000,
      date: bounds.startDate,
      description: 'Spesa al mercato',
      category: null,
      shoppingItemId: null,
      taskId: null,
    });
    await syncAllocations(cycleId!);

    const spent = useDataStore.getState().allocations.find((a) => a.bucketId === spese.id);
    expect(spent?.actualAmount).toBe(5000);
    expect(spent!.plannedAmount - spent!.actualAmount).toBe(103000);
  });

  it('ricalcola la ripartizione quando cambia la regola di un bucket', async () => {
    const { createItem, updateItem } = useDataStore.getState();

    const fisso = makeBucket('Fisso', { type: 'fixed', value: 50000 }, 1);
    const resto = makeBucket('Resto', { type: 'remainder' }, 2);
    for (const bucket of [fisso, resto]) await createItem('buckets', bucket);

    const bounds = computeCycleBounds(todayCalendarDate(), MODE, 1);
    const cycleId = await openCycle({
      bounds,
      label: describeCycle(bounds, MODE),
      openingBalance: 100000,
    });

    const planned = (bucketId: string) =>
      useDataStore.getState().allocations.find((a) => a.bucketId === bucketId)?.plannedAmount ?? -1;

    expect(planned(fisso.id)).toBe(50000);
    expect(planned(resto.id)).toBe(50000);

    await updateItem('buckets', fisso.id, { rule: { type: 'fixed', value: 70000 } });
    await syncActiveCycle();

    expect(planned(fisso.id)).toBe(70000);
    expect(planned(resto.id)).toBe(30000);
    expect(cycleId).not.toBeNull();
  });
});
