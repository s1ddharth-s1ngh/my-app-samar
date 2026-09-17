import type { Bucket, Cents, ID } from '@/data/types';
import { percent } from './money';

/**
 * The allocation engine decides how the money that came into a cycle is split
 * across buckets. It is pure: no dates, no storage, no React.
 *
 * Order of service (see §5.1 of the spec):
 *   1. locked allocations keep the amount the user set, and come off the top;
 *   2. `fixed` buckets, by priority;
 *   3. `percent` buckets on the gross income;
 *   4. `percent` buckets on what is left after the fixed ones;
 *   5. the `remainder` bucket takes the rest.
 *
 * Every bucket takes at most what is still available, so the total handed out
 * never exceeds the income. What nobody claims comes back as `unallocated`.
 */

export interface LockedAllocation {
  bucketId: ID;
  amount: Cents;
}

export interface AllocationLine {
  bucketId: ID;
  plannedAmount: Cents;
  isLocked: boolean;
}

export interface AllocationResult {
  lines: AllocationLine[];
  /** What no bucket claimed. Shown in the UI as a virtual "Non allocato" bucket. */
  unallocated: Cents;
  /** True when at least one bucket got less than its rule asked for. */
  underfunded: boolean;
  /** The buckets that were short, in the order they were served. */
  underfundedBucketIds: ID[];
}

export interface AllocationInput {
  totalIncome: Cents;
  /** Only active buckets belong here; the caller filters. */
  buckets: Bucket[];
  locked?: LockedAllocation[];
}

function byPriority(a: Bucket, b: Bucket): number {
  return a.priority - b.priority || a.name.localeCompare(b.name, 'it');
}

export function computeAllocations(input: AllocationInput): AllocationResult {
  const { totalIncome } = input;
  const locked = input.locked ?? [];
  const lockedById = new Map(locked.map((entry) => [entry.bucketId, entry.amount]));

  const buckets = [...input.buckets].sort(byPriority);
  const planned = new Map<ID, Cents>();
  const underfundedBucketIds: ID[] = [];

  let available = totalIncome;

  // 1. Locked allocations: the user's number wins, even if it overdraws.
  for (const bucket of buckets) {
    const lockedAmount = lockedById.get(bucket.id);
    if (lockedAmount !== undefined) {
      planned.set(bucket.id, lockedAmount);
      available -= lockedAmount;
    }
  }

  const isFree = (bucket: Bucket) => !lockedById.has(bucket.id);

  /** Hands a bucket what it asked for, or whatever is left if that is less. */
  const serve = (bucket: Bucket, wanted: Cents): void => {
    const granted = Math.max(0, Math.min(wanted, Math.max(0, available)));
    planned.set(bucket.id, granted);
    available -= granted;
    if (granted < wanted) underfundedBucketIds.push(bucket.id);
  };

  // 2. Fixed amounts, by priority.
  for (const bucket of buckets) {
    if (isFree(bucket) && bucket.rule.type === 'fixed') {
      serve(bucket, bucket.rule.value);
    }
  }

  // The base for `afterFixed` is what survived the locked and fixed buckets.
  const afterFixedBase = Math.max(0, available);

  // 3. Percentages on the gross income.
  for (const bucket of buckets) {
    if (isFree(bucket) && bucket.rule.type === 'percent' && bucket.rule.base === 'gross') {
      serve(bucket, percent(Math.max(0, totalIncome), bucket.rule.value));
    }
  }

  // 4. Percentages on the residual after the fixed buckets.
  for (const bucket of buckets) {
    if (isFree(bucket) && bucket.rule.type === 'percent' && bucket.rule.base === 'afterFixed') {
      serve(bucket, percent(afterFixedBase, bucket.rule.value));
    }
  }

  // 5. The remainder bucket takes everything that is left.
  const remainderBucket = buckets.find(
    (bucket) => isFree(bucket) && bucket.rule.type === 'remainder'
  );
  if (remainderBucket) {
    const rest = Math.max(0, available);
    planned.set(remainderBucket.id, rest);
    available -= rest;
  }

  // Rounding dust: truncating percentages can leave a handful of cents behind.
  // Those belong to a real bucket, not to a "Non allocato" line the user would
  // have to think about. A genuine surplus is larger than one cent per bucket.
  const servedCount = buckets.filter(isFree).length;
  if (!remainderBucket && available > 0 && available < Math.max(1, servedCount)) {
    const lowestPriority = [...buckets].reverse().find(isFree);
    if (lowestPriority) {
      planned.set(lowestPriority.id, (planned.get(lowestPriority.id) ?? 0) + available);
      available = 0;
    }
  }

  const lines: AllocationLine[] = buckets.map((bucket) => ({
    bucketId: bucket.id,
    plannedAmount: planned.get(bucket.id) ?? 0,
    isLocked: lockedById.has(bucket.id),
  }));

  return {
    lines,
    unallocated: available,
    underfunded: underfundedBucketIds.length > 0,
    underfundedBucketIds,
  };
}

/** Convenience for the invariant the UI relies on: nothing is created or lost. */
export function totalPlanned(result: AllocationResult): Cents {
  return result.lines.reduce((acc, line) => acc + line.plannedAmount, 0);
}
