import { describe, it, expect } from 'vitest';
import { parseMoneyString } from './MoneyInput';

describe('parseMoneyString', () => {
  it('parsa correttamente 15 formati di stringa', () => {
    // 1. Base intero
    expect(parseMoneyString('100')).toBe(10000);
    // 2. Virgola e decimali
    expect(parseMoneyString('100,50')).toBe(10050);
    // 3. Punto e decimali
    expect(parseMoneyString('100.50')).toBe(10050);
    // 4. Singolo decimale
    expect(parseMoneyString('100,5')).toBe(10050);
    // 5. Migliaia con punto e decimali con virgola (IT)
    expect(parseMoneyString('1.234,56')).toBe(123456);
    // 6. Migliaia con virgola e decimali con punto (EN)
    expect(parseMoneyString('1,234.56')).toBe(123456);
    // 7. Spazi e lettere extra (sporca)
    expect(parseMoneyString(' 1234,56 € ')).toBe(123456);
    // 8. Zero iniziale
    expect(parseMoneyString('0,50')).toBe(50);
    // 9. Senza zero iniziale
    expect(parseMoneyString(',50')).toBe(50);
    // 10. Negativo
    expect(parseMoneyString('-100')).toBe(-10000);
    // 11. Negativo decimale
    expect(parseMoneyString('-1.234,56')).toBe(-123456);
    // 12. Punti multipli confusi, tiene l'ultimo come decimale
    expect(parseMoneyString('1.2.3.4,56')).toBe(123456);
    // 13. Solo interi grossi
    expect(parseMoneyString('1000000')).toBe(100000000);
    // 14. Zero esatto
    expect(parseMoneyString('0')).toBe(0);
    // 15. Formato strano ma leggibile
    expect(parseMoneyString('€1,234.56')).toBe(123456);
  });

  it('restituisce null per input non validi', () => {
    expect(parseMoneyString('')).toBeNull();
    expect(parseMoneyString('abc')).toBeNull();
    expect(parseMoneyString('-')).toBeNull();
    expect(parseMoneyString(',')).toBeNull();
    expect(parseMoneyString('.')).toBeNull();
  });
});
