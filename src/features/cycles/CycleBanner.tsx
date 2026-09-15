import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button } from '@/ui';
import { checkCycleState, getTodayDate } from './engine';
import { CalendarClock } from 'lucide-react';

export function CycleBanner() {
  const cycles = useDataStore((state) => state.cycles);
  const settings = useDataStore((state) => state.settings);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const addToast = useToastStore((state) => state.addToast);

  if (!settings) return null;

  const state = checkCycleState(cycles, settings, getTodayDate());

  if (!state.needsAction) {
    return null;
  }

  const handleExecute = async () => {
    try {
      if (state.actionType === 'close_and_open' && state.activeCycle) {
        // Close current
        await updateItem('cycles', state.activeCycle.id, {
          status: 'closed',
          closedAt: new Date().toISOString(),
        });
      }

      // Open new
      if (state.suggestedBounds && state.suggestedLabel) {
        await createItem('cycles', {
          id: crypto.randomUUID(),
          label: state.suggestedLabel,
          startDate: state.suggestedBounds.startDate,
          endDate: state.suggestedBounds.endDate,
          status: 'active',
          openingBalance: 0, // Should be computed based on previous cycle, but for now 0
          closedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        });
        addToast('Nuovo ciclo aperto con successo!', 'success');
      }
    } catch {
      addToast("Errore durante l'apertura del ciclo.", 'error');
    }
  };

  return (
    <div className="bg-accent/10 dark:bg-accent/20 border border-accent/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div className="flex gap-3">
        <CalendarClock className="text-accent shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-accent">
            {state.actionType === 'create_first' ? 'Benvenuto!' : 'Ciclo concluso'}
          </h3>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {state.actionType === 'create_first'
              ? 'Inizia aprendo il tuo primo ciclo finanziario.'
              : 'È ora di chiudere il ciclo precedente e aprirne uno nuovo.'}
          </p>
        </div>
      </div>
      <Button onClick={handleExecute} className="shrink-0 w-full sm:w-auto">
        Apri {state.suggestedLabel}
      </Button>
    </div>
  );
}
