import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IndexedDBAdapter } from './adapter';

describe('IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter;

  beforeEach(async () => {
    adapter = new IndexedDBAdapter();
    await adapter.init('test_db_' + Date.now());
  });

  it('create -> list -> update -> soft delete', async () => {
    const item = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      name: 'Test Project',
      description: null,
      color: '#000',
      icon: 'star',
      status: 'active' as const,
      order: 1,
    };

    // Create
    await adapter.projects.create(item);

    // List
    let list = await adapter.projects.list();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Test Project');

    // Update
    await adapter.projects.update(item.id, { name: 'Updated Project' });
    list = await adapter.projects.list();
    expect(list[0].name).toBe('Updated Project');

    // Soft delete
    await adapter.projects.remove(item.id);

    // Sparisce da list
    list = await adapter.projects.list();
    expect(list.length).toBe(0);

    // Ma è ancora nel DB se cerchiamo con includeDeleted
    const all = await adapter.projects.list({ includeDeleted: true });
    expect(all.length).toBe(1);
    expect(all[0].deletedAt).not.toBeNull();
  });
});
