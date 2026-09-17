import type { Cents } from '@/data/types';

/**
 * Money is always integer cents. Nothing in this module produces a fraction of
 * a cent, and nothing here formats for display except `formatCents`, which is
 * the only function that knows about locales.
 */

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

function assertCents(value: number, label: string): asserts value is Cents {
  if (!Number.isInteger(value)) {
    throw new MoneyError(`${label} must be an integer number of cents, got ${value}`);
  }
}

export function isCents(value: unknown): value is Cents {
  return typeof value === 'number' && Number.isInteger(value);
}

export function add(...amounts: Cents[]): Cents {
  let total = 0;
  for (const amount of amounts) {
    assertCents(amount, 'amount');
    total += amount;
  }
  return total;
}

export function subtract(from: Cents, ...amounts: Cents[]): Cents {
  assertCents(from, 'from');
  return from - add(...amounts);
}

export function sum(amounts: Cents[]): Cents {
  return add(...amounts);
}

/** Never lets a balance read as negative when the caller only wants the shortfall hidden. */
export function clampToZero(amount: Cents): Cents {
  assertCents(amount, 'amount');
  return amount < 0 ? 0 : amount;
}

/**
 * `percentage` is a plain number: 15 means 15%. Truncates toward zero, so a
 * percentage never hands out a cent the base did not contain.
 */
export function percent(amount: Cents, percentage: number): Cents {
  assertCents(amount, 'amount');
  if (!Number.isFinite(percentage)) {
    throw new MoneyError(`percentage must be finite, got ${percentage}`);
  }
  return Math.trunc((amount * percentage) / 100);
}

/**
 * Splits `amount` proportionally to `weights` using the largest-remainder
 * method, so the parts add up to `amount` exactly — no cent is created or lost.
 *
 * Leftover cents (at most `weights.length - 1`) go to the entries with the
 * largest truncated fraction; ties are broken by the later index, which is the
 * lowest-priority bucket in our ordering.
 *
 * With no positive weight there is nothing to distribute proportionally, so the
 * whole amount lands on the last entry rather than vanishing.
 */
export function split(amount: Cents, weights: number[]): Cents[] {
  assertCents(amount, 'amount');
  for (const weight of weights) {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new MoneyError(`weights must be finite and non-negative, got ${weight}`);
    }
  }

  if (weights.length === 0) return [];

  const sign = amount < 0 ? -1 : 1;
  const absolute = Math.abs(amount);
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);

  if (totalWeight === 0) {
    const parts = new Array<Cents>(weights.length).fill(0);
    parts[weights.length - 1] = amount;
    return parts;
  }

  const exact = weights.map((weight) => (absolute * weight) / totalWeight);
  const parts = exact.map((value) => Math.floor(value));
  let remainder = absolute - parts.reduce((acc, part) => acc + part, 0);

  // Hand out the leftover cents, biggest fractional part first.
  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || b.index - a.index);

  let cursor = 0;
  while (remainder > 0) {
    const target = order[cursor % order.length];
    if (target) parts[target.index] = (parts[target.index] ?? 0) + 1;
    remainder -= 1;
    cursor += 1;
  }

  return parts.map((part) => part * sign);
}

const FORMATTER = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
});

const FORMATTER_NO_DECIMALS = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export interface FormatOptions {
  /** Drop the decimals when the amount is a whole euro. Useful in dense lists. */
  compact?: boolean;
  /** Always show a leading + on positive amounts. */
  showSign?: boolean;
}

export function formatCents(amount: Cents, options: FormatOptions = {}): string {
  assertCents(amount, 'amount');
  const useCompact = options.compact === true && amount % 100 === 0;
  const formatter = useCompact ? FORMATTER_NO_DECIMALS : FORMATTER;
  const formatted = formatter.format(amount / 100);
  return options.showSign === true && amount > 0 ? `+${formatted}` : formatted;
}
