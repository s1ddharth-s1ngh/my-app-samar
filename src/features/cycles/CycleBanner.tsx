import { CalendarClock } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button } from '@/ui';
import { evaluateCycleState, todayCalendarDate } from '@/domain/cycles';
import { newBase, nowInstant } from '@/lib/record';

/**
 * Opening or closing a cycle is always proposed, never automatic: the banner
 * only appears when the active cycle no longer covers today.
 */
export function CycleBanner() {
  const cycles = useDataStore((state) => state.cycles);
  const settings = useDataStore((state) => state.settings);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const addToast = useToastStore((state) => state.addToast);

  if (!settings) return null;

  const state = evaluateCycleState(cycles, settings, todayCalendarDate());
  if (state.action === 'none') return null;

  const isFirst = state.action === 'createFirst';

  const handleExecute = async () => {
    try {
      if (state.action === 'closeAndOpen' && state.activeCycle) {
        await updateItem('cycles', state.activeCycle.id, {
          status: 'closed',
          closedAt: nowInstant(),
          updatedAt: nowInstant(),
        });
      }

      await createItem('cycles', {
        ...newBase(),
        label: state.suggestedLabel,
        startDate: state.suggestedBounds.startDate,
        endDate: state.suggestedBounds.endDate,
        status: 'active',
        openingBalance: 0,
        closedAt: null,
      });
      addToast(`Hai aperto il ciclo ${state.suggestedLabel}.`, 'success');
    } catch {
      addToast('Non è stato possibile aprire il ciclo. Riprova.', 'error');
    }
  };

  return (
    <div className="bg-accent/10 border border-accent/25 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div className="flex gap-3">
        <CalendarClock className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h2 className="font-heading font-semibold text-accent">
            {isFirst ? 'Nessun ciclo aperto' : 'Il ciclo è finito'}
          </h2>
          <p className="text-sm text-ink-muted">
            {isFirst
              ? 'Apri il primo ciclo per iniziare a registrare entrate e spese.'
              : 'Chiudi quello precedente e apri il successivo: niente viene fatto senza di te.'}
          </p>
        </div>
      </div>
      <Button onClick={() => void handleExecute()} className="shrink-0 w-full sm:w-auto">
        Apri {state.suggestedLabel}
      </Button>
    </div>
  );
}
