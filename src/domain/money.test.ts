import { describe, it, expect } from 'vitest';
import {
  add,
  clampToZero,
  formatCents,
  isCents,
  MoneyError,
  percent,
  split,
  subtract,
  sum,
} from './money';

/** Deterministic PRNG so a failing property test is reproducible. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe('add / subtract / sum', () => {
  it('adds integer cents', () => {
    expect(add(1050, 250, 5)).toBe(1305);
    expect(add()).toBe(0);
  });

  it('subtracts a list of amounts', () => {
    expect(subtract(10000, 2500, 500)).toBe(7000);
  });

  it('sums an array', () => {
    expect(sum([100, 200, 300])).toBe(600);
    expect(sum([])).toBe(0);
  });

  it('refuses fractional cents', () => {
    expect(() => add(10.5)).toThrow(MoneyError);
    expect(() => subtract(10.5, 1)).toThrow(MoneyError);
  });
});

describe('clampToZero', () => {
  it('floors negative balances at zero and leaves positives alone', () => {
    expect(clampToZero(-1)).toBe(0);
    expect(clampToZero(0)).toBe(0);
    expect(clampToZero(4200)).toBe(4200);
  });
});

describe('percent', () => {
  it('computes a percentage truncating toward zero', () => {
    expect(percent(10000, 15)).toBe(1500);
    expect(percent(333, 10)).toBe(33); // 33.3 -> 33, never 34
    expect(percent(0, 50)).toBe(0);
    expect(percent(10000, 0)).toBe(0);
  });

  it('never hands out more than the base', () => {
    expect(percent(777, 100)).toBe(777);
  });

  it('refuses a non-finite percentage', () => {
    expect(() => percent(100, Number.NaN)).toThrow(MoneyError);
  });
});

describe('split', () => {
  it('splits evenly when the amount divides cleanly', () => {
    expect(split(900, [1, 1, 1])).toEqual([300, 300, 300]);
  });

  it('distributes leftover cents instead of losing them', () => {
    const parts = split(1000, [1, 1, 1]);
    expect(sum(parts)).toBe(1000);
    // The leftover cent goes to the last entry: the lowest priority.
    expect(parts).toEqual([333, 333, 334]);
  });

  it('respects the weights', () => {
    expect(split(10000, [50, 30, 20])).toEqual([5000, 3000, 2000]);
  });

  it('returns an empty array for no weights', () => {
    expect(split(1000, [])).toEqual([]);
  });

  it('gives everything to the last entry when no weight is positive', () => {
    expect(split(1000, [0, 0, 0])).toEqual([0, 0, 1000]);
  });

  it('handles a zero amount', () => {
    expect(split(0, [3, 1])).toEqual([0, 0]);
  });

  it('handles negative amounts symmetrically', () => {
    const parts = split(-1000, [1, 1, 1]);
    expect(sum(parts)).toBe(-1000);
  });

  it('refuses negative weights', () => {
    expect(() => split(100, [1, -1])).toThrow(MoneyError);
  });

  it('keeps the sum exact over 1000 random cases', () => {
    const random = makeRandom(20260917);

    for (let run = 0; run < 1000; run += 1) {
      const amount = Math.floor(random() * 5_000_00);
      const count = 1 + Math.floor(random() * 8);
      const weights = Array.from({ length: count }, () => Math.floor(random() * 100));

      const parts = split(amount, weights);

      expect(parts).toHaveLength(count);
      expect(sum(parts)).toBe(amount);
      expect(parts.every((part) => Number.isInteger(part))).toBe(true);
      expect(parts.every((part) => part >= 0)).toBe(true);
    }
  });
});

describe('isCents', () => {
  it('accepts integers only', () => {
    expect(isCents(100)).toBe(true);
    expect(isCents(100.5)).toBe(false);
    expect(isCents('100')).toBe(false);
    expect(isCents(null)).toBe(false);
  });
});

describe('formatCents', () => {
  it('formats in Italian euros', () => {
    // Grouping separators depend on the ICU data bundled with the runtime,
    // so we assert the decimal part and the symbol, not the thousands dot.
    expect(formatCents(123456).replace(/\s/g, ' ')).toMatch(/^1\.?234,56 €$/);
  });

  it('drops the decimals on whole euros when compact', () => {
    expect(formatCents(65000, { compact: true }).replace(/\s/g, ' ')).toBe('650 €');
    expect(formatCents(65050, { compact: true }).replace(/\s/g, ' ')).toBe('650,50 €');
  });

  it('shows an explicit plus sign on request', () => {
    expect(formatCents(500, { showSign: true }).startsWith('+')).toBe(true);
    expect(formatCents(-500, { showSign: true }).startsWith('+')).toBe(false);
    expect(formatCents(0, { showSign: true }).startsWith('+')).toBe(false);
  });
});
