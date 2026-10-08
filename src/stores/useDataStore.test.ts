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

  it('carica i dati di seed e popola lo store', async () => {
    await useDataStore.getState().loadSeed();
    const state = useDataStore.getState();
    expect(state.incomeSources.length).toBe(2);
    expect(state.buckets.length).toBe(5);
    expect(state.projects.length).toBe(2);
    expect(state.tasks.length).toBe(10);
    expect(state.shoppingItems.length).toBe(4);
    expect(state.cycles.length).toBe(1);
    expect(state.transactions.length).toBe(1);
    expect(state.settings?.currency).toBe('EUR');

    // The sample cycle must be the one containing today, already split.
    const today = new Date().toISOString().slice(0, 10);
    expect(state.cycles[0]!.startDate <= today).toBe(true);
    expect(state.cycles[0]!.endDate >= today).toBe(true);
    expect(state.allocations.length).toBe(state.buckets.length);

    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.message.includes('Dati di esempio'))).toBe(true);
  });

  it('svuota tutti i dati', async () => {
    await useDataStore.getState().loadSeed();
    expect(useDataStore.getState().projects.length).toBe(2);

    await useDataStore.getState().resetAll();
    const state = useDataStore.getState();
    expect(state.projects.length).toBe(0);
    expect(state.tasks.length).toBe(0);
    // Emptying the data must not leave the app without settings: without them
    // the cycle banner hides, and nothing can be opened again.
    expect(state.settings).not.toBeNull();
    expect(state.settings?.cycleMode).toBe('calendarMonth');
  });
});
