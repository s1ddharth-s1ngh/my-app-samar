import { describe, it, expect } from 'vitest';
import type { AllocationRule, Bucket } from '@/data/types';
import { computeAllocations, totalPlanned } from './allocation';

let counter = 0;

function bucket(name: string, priority: number, rule: AllocationRule): Bucket {
  counter += 1;
  return {
    id: `bucket-${counter}`,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    name,
    kind: 'custom',
    rule,
    priority,
    targetAmount: null,
    color: '#2F6F5E',
    icon: 'wallet',
    isActive: true,
  };
}

function plannedFor(result: ReturnType<typeof computeAllocations>, target: Bucket): number {
  return result.lines.find((line) => line.bucketId === target.id)?.plannedAmount ?? 0;
}

/** Deterministic PRNG so a failing property test is reproducible. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe('computeAllocations', () => {
  it('serves fixed buckets in priority order', () => {
    const rent = bucket('Affitto', 0, { type: 'fixed', value: 65000 });
    const bills = bucket('Bollette', 1, { type: 'fixed', value: 12000 });

    const result = computeAllocations({ totalIncome: 210000, buckets: [bills, rent] });

    expect(plannedFor(result, rent)).toBe(65000);
    expect(plannedFor(result, bills)).toBe(12000);
    expect(result.unallocated).toBe(210000 - 65000 - 12000);
    expect(result.underfunded).toBe(false);
  });

  it('handles percentages on the gross income', () => {
    const invest = bucket('Investimenti', 0, { type: 'percent', value: 15, base: 'gross' });
    const save = bucket('Risparmi', 1, { type: 'percent', value: 10, base: 'gross' });

    const result = computeAllocations({ totalIncome: 200000, buckets: [invest, save] });

    expect(plannedFor(result, invest)).toBe(30000);
    expect(plannedFor(result, save)).toBe(20000);
    expect(result.unallocated).toBe(150000);
  });

  it('computes afterFixed percentages on what survives the fixed buckets', () => {
    const rent = bucket('Affitto', 0, { type: 'fixed', value: 100000 });
    const invest = bucket('Investimenti', 1, { type: 'percent', value: 50, base: 'afterFixed' });

    const result = computeAllocations({ totalIncome: 200000, buckets: [rent, invest] });

    expect(plannedFor(result, rent)).toBe(100000);
    expect(plannedFor(result, invest)).toBe(50000);
  });

  it('runs the full mixed scenario from the spec', () => {
    const rent = bucket('Affitto', 0, { type: 'fixed', value: 65000 });
    const bills = bucket('Bollette', 1, { type: 'fixed', value: 15000 });
    const invest = bucket('Investimenti', 2, { type: 'percent', value: 15, base: 'afterFixed' });
    const save = bucket('Risparmi', 3, { type: 'percent', value: 10, base: 'afterFixed' });
    const spending = bucket('Spese', 4, { type: 'remainder' });

    const result = computeAllocations({
      totalIncome: 210000,
      buckets: [rent, bills, invest, save, spending],
    });

    const afterFixed = 210000 - 65000 - 15000; // 130000
    expect(plannedFor(result, invest)).toBe(19500);
    expect(plannedFor(result, save)).toBe(13000);
    expect(plannedFor(result, spending)).toBe(afterFixed - 19500 - 13000);
    expect(result.unallocated).toBe(0);
    expect(totalPlanned(result)).toBe(210000);
  });

  it('flags the buckets left uncovered when the money runs out', () => {
    const rent = bucket('Affitto', 0, { type: 'fixed', value: 65000 });
    const bills = bucket('Bollette', 1, { type: 'fixed', value: 40000 });

    const result = computeAllocations({ totalIncome: 80000, buckets: [rent, bills] });

    expect(plannedFor(result, rent)).toBe(65000);
    expect(plannedFor(result, bills)).toBe(15000);
    expect(result.underfunded).toBe(true);
    expect(result.underfundedBucketIds).toEqual([bills.id]);
    expect(result.unallocated).toBe(0);
  });

  it('gives zero to the buckets served after the money is gone', () => {
    const rent = bucket('Affitto', 0, { type: 'fixed', value: 90000 });
    const bills = bucket('Bollette', 1, { type: 'fixed', value: 20000 });
    const gym = bucket('Palestra', 2, { type: 'fixed', value: 5000 });

    const result = computeAllocations({ totalIncome: 90000, buckets: [rent, bills, gym] });

    expect(plannedFor(result, bills)).toBe(0);
    expect(plannedFor(result, gym)).toBe(0);
    expect(result.underfundedBucketIds).toEqual([bills.id, gym.id]);
  });

  it('keeps locked allocations untouched and takes them off the top', () => {
    const invest = bucket('Investimenti', 0, { type: 'percent', value: 15, base: 'gross' });
    const spending = bucket('Spese', 1, { type: 'remainder' });

    const result = computeAllocations({
      totalIncome: 200000,
      buckets: [invest, spending],
      locked: [{ bucketId: invest.id, amount: 40000 }],
    });

    expect(plannedFor(result, invest)).toBe(40000);
    expect(result.lines.find((line) => line.bucketId === invest.id)?.isLocked).toBe(true);
    expect(plannedFor(result, spending)).toBe(160000);
  });

  it('does not recompute a locked bucket when income grows', () => {
    const invest = bucket('Investimenti', 0, { type: 'percent', value: 15, base: 'gross' });
    const spending = bucket('Spese', 1, { type: 'remainder' });
    const locked = [{ bucketId: invest.id, amount: 40000 }];

    const before = computeAllocations({ totalIncome: 200000, buckets: [invest, spending], locked });
    const after = computeAllocations({ totalIncome: 230000, buckets: [invest, spending], locked });

    expect(plannedFor(before, invest)).toBe(40000);
    expect(plannedFor(after, invest)).toBe(40000);
    expect(plannedFor(after, spending)).toBe(190000);
  });

  it('leaves the surplus unallocated when there is no remainder bucket', () => {
    const rent = bucket('Affitto', 0, { type: 'fixed', value: 65000 });

    const result = computeAllocations({ totalIncome: 200000, buckets: [rent] });

    expect(result.unallocated).toBe(135000);
    expect(totalPlanned(result) + result.unallocated).toBe(200000);
  });

  it('gives rounding dust to the lowest priority bucket, not to the surplus', () => {
    const a = bucket('A', 0, { type: 'percent', value: 33.333, base: 'gross' });
    const b = bucket('B', 1, { type: 'percent', value: 33.333, base: 'gross' });
    const c = bucket('C', 2, { type: 'percent', value: 33.334, base: 'gross' });

    const result = computeAllocations({ totalIncome: 100, buckets: [a, b, c] });

    expect(result.unallocated).toBe(0);
    expect(totalPlanned(result)).toBe(100);
  });

  it('handles zero income without producing negative numbers', () => {
    const rent = bucket('Affitto', 0, { type: 'fixed', value: 65000 });
    const spending = bucket('Spese', 1, { type: 'remainder' });

    const result = computeAllocations({ totalIncome: 0, buckets: [rent, spending] });

    expect(plannedFor(result, rent)).toBe(0);
    expect(plannedFor(result, spending)).toBe(0);
    expect(result.unallocated).toBe(0);
    expect(result.underfunded).toBe(true);
  });

  it('handles an empty bucket list', () => {
    const result = computeAllocations({ totalIncome: 150000, buckets: [] });

    expect(result.lines).toEqual([]);
    expect(result.unallocated).toBe(150000);
    expect(result.underfunded).toBe(false);
  });

  it('clips percentages that together ask for more than the gross', () => {
    const a = bucket('A', 0, { type: 'percent', value: 70, base: 'gross' });
    const b = bucket('B', 1, { type: 'percent', value: 70, base: 'gross' });

    const result = computeAllocations({ totalIncome: 100000, buckets: [a, b] });

    expect(plannedFor(result, a)).toBe(70000);
    expect(plannedFor(result, b)).toBe(30000);
    expect(result.underfundedBucketIds).toEqual([b.id]);
  });

  it('never creates or loses money across 1000 random incomes', () => {
    const random = makeRandom(4242);
    const rent = bucket('Affitto', 0, { type: 'fixed', value: 65000 });
    const invest = bucket('Investimenti', 1, { type: 'percent', value: 15, base: 'afterFixed' });
    const save = bucket('Risparmi', 2, { type: 'percent', value: 10, base: 'gross' });
    const spending = bucket('Spese', 3, { type: 'remainder' });
    const buckets = [rent, invest, save, spending];

    for (let run = 0; run < 1000; run += 1) {
      const totalIncome = Math.floor(random() * 500_000_0);
      const result = computeAllocations({ totalIncome, buckets });

      expect(totalPlanned(result) + result.unallocated).toBe(totalIncome);
      expect(result.unallocated).toBeGreaterThanOrEqual(0);
      expect(result.lines.every((line) => line.plannedAmount >= 0)).toBe(true);
      expect(result.lines.every((line) => Number.isInteger(line.plannedAmount))).toBe(true);
    }
  });
});
