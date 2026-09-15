import { describe, it, expect } from 'vitest';
import { bucketSchema, cycleSchema, centsSchema, clockSchema } from './schemas';

describe('Validation Schemas', () => {
  it('centsSchema rifiuta input non validi con messaggi in italiano', () => {
    const r1 = centsSchema.safeParse(-10);
    expect(r1.success).toBe(false);
    if (!r1.success) expect(r1.error.issues[0]?.message).toBe('Non può essere negativo');

    const r2 = centsSchema.safeParse(10.5);
    expect(r2.success).toBe(false);
    if (!r2.success)
      expect(r2.error.issues[0]?.message).toBe('Deve essere un numero intero (centesimi)');

    const r3 = centsSchema.safeParse('10');
    expect(r3.success).toBe(false);
    if (!r3.success) expect(r3.error.issues[0]?.message).toBe('Deve essere un numero');
  });

  it('clockSchema rifiuta input non validi con messaggi in italiano', () => {
    const r = clockSchema.safeParse('25:00');
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Deve essere nel formato HH:mm');
  });

  it('bucketSchema rifiuta input non validi con messaggi in italiano', () => {
    const base = {
      id: crypto.randomUUID(),
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-15T10:00:00Z',
      deletedAt: null,
      name: 'Test',
      kind: 'custom',
      rule: { type: 'fixed', value: 100 },
      priority: 1,
      targetAmount: null,
      color: '#fff',
      icon: 'icon',
      isActive: true,
    };

    const r1 = bucketSchema.safeParse({ ...base, name: '' });
    expect(r1.success).toBe(false);
    if (!r1.success) expect(r1.error.issues[0]?.message).toBe('Il nome è obbligatorio');

    const r2 = bucketSchema.safeParse({
      ...base,
      rule: { type: 'percent', value: 150, base: 'gross' },
    });
    expect(r2.success).toBe(false);
    if (!r2.success) expect(r2.error.issues[0]?.message).toBe('Massimo 100%');

    const r3 = bucketSchema.safeParse({
      ...base,
      rule: { type: 'percent', value: -10, base: 'gross' },
    });
    expect(r3.success).toBe(false);
    if (!r3.success) expect(r3.error.issues[0]?.message).toBe('Minimo 0%');
  });

  it('cycleSchema rifiuta date invertite', () => {
    const base = {
      id: crypto.randomUUID(),
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-15T10:00:00Z',
      deletedAt: null,
      label: 'Ciclo Test',
      startDate: '2026-10-01',
      endDate: '2026-09-30',
      status: 'planned',
      openingBalance: 0,
      closedAt: null,
    };

    const r1 = cycleSchema.safeParse(base);
    expect(r1.success).toBe(false);
    if (!r1.success)
      expect(r1.error.issues[0]?.message).toBe(
        'La data di fine non può precedere la data di inizio'
      );
  });
});
