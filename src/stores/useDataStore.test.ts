import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useDataStore } from './useDataStore';
import { useToastStore } from './toast';
import { dbAdapter } from './db';

describe('useDataStore', () => {
  beforeEach(async () => {
    useDataStore.setState({ projects: [], isHydrated: true });
    useToastStore.setState({ toasts: [] });
    await dbAdapter.init('test_db_store_' + Date.now());
  });

  it('esegue update ottimistico e rollback in caso di errore', async () => {
    const item = {
      id: '1',
      name: 'Project 1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      deletedAt: null,
      description: null,
      color: '#000',
      icon: 'star',
      status: 'active' as const,
      order: 1,
    };

    useDataStore.setState({ projects: [item] });

    vi.spyOn(dbAdapter.projects, 'update').mockRejectedValueOnce(new Error('Finto errore'));

    const updatePromise = useDataStore
      .getState()
      .updateItem('projects', '1', { name: 'Optimistic Name' });

    expect(useDataStore.getState().projects[0]?.name).toBe('Optimistic Name');

    await expect(updatePromise).rejects.toThrow('Finto errore');

    expect(useDataStore.getState().projects[0]?.name).toBe('Project 1');

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0]?.message).toBe('Non è stato possibile salvare. Riprova.');
    expect(toasts[0]?.type).toBe('error');
  });
});
