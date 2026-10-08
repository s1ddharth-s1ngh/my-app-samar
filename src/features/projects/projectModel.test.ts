import { describe, it, expect } from 'vitest';
import type { Project } from '@/data/types';
import { ordered, reorder } from './projectModel';

function project(id: string, order: number, createdAt = '2026-01-01T00:00:00Z'): Project {
  return {
    id,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    name: id,
    description: null,
    color: '#000',
    icon: '📁',
    status: 'active',
    order,
  };
}

describe('ordered', () => {
  it('non muta la lista di partenza', () => {
    const list = [project('b', 1), project('a', 0)];
    expect(ordered(list).map((p) => p.id)).toEqual(['a', 'b']);
    expect(list.map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('rompe la parità di order con la data di creazione', () => {
    const list = [project('b', 0, '2026-02-01T00:00:00Z'), project('a', 0, '2026-01-01T00:00:00Z')];
    expect(ordered(list).map((p) => p.id)).toEqual(['a', 'b']);
  });
});

describe('reorder', () => {
  it('scambia con il vicino e rinumera solo le righe cambiate', () => {
    const list = [project('a', 0), project('b', 1), project('c', 2)];
    expect(reorder(list, 'c', -1)).toEqual([
      { id: 'c', order: 1 },
      { id: 'b', order: 2 },
    ]);
  });

  it('rinumera anche gli order sparsi', () => {
    const list = [project('a', 5), project('b', 9)];
    expect(reorder(list, 'b', -1)).toEqual([
      { id: 'b', order: 0 },
      { id: 'a', order: 1 },
    ]);
  });

  it('non fa nulla fuori dai bordi o su un id sconosciuto', () => {
    const list = [project('a', 0), project('b', 1)];
    expect(reorder(list, 'a', -1)).toEqual([]);
    expect(reorder(list, 'b', 1)).toEqual([]);
    expect(reorder(list, 'z', 1)).toEqual([]);
  });
});
