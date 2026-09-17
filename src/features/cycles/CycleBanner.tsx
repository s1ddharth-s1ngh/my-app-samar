import { CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { Button } from '@/ui';
import { evaluateCycleState, todayCalendarDate } from '@/domain/cycles';
import { openCycle } from '@/stores/cycleOperations';

/**
 * Opening or closing a cycle is always proposed, never automatic: the banner
 * only appears when the active cycle no longer covers today.
 */
export function CycleBanner() {
  const cycles = useDataStore((state) => state.cycles);
  const settings = useDataStore((state) => state.settings);
  const [isWorking, setIsWorking] = useState(false);

  if (!settings) return null;

  const state = evaluateCycleState(cycles, settings, todayCalendarDate());
  if (state.action === 'none') return null;

  const isFirst = state.action === 'createFirst';

  const handleCreateFirst = async () => {
    setIsWorking(true);
    try {
      await openCycle({ bounds: state.suggestedBounds, label: state.suggestedLabel });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="rounded-[18px] border border-accent/25 bg-accent/10 p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div className="flex gap-3">
        <span className="icon-tile">
          <CalendarClock size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold text-ink">
            {isFirst ? 'Nessun ciclo aperto' : 'Il ciclo è finito'}
          </h2>
          <p className="text-sm text-ink-muted">
            {isFirst
              ? 'Apri il primo ciclo per iniziare a registrare entrate e spese.'
              : 'Guarda il riepilogo, poi chiudilo e apri il successivo.'}
          </p>
        </div>
      </div>

      {isFirst ? (
        <Button
          onClick={() => void handleCreateFirst()}
          disabled={isWorking}
          className="shrink-0 w-full sm:w-auto"
        >
          Apri {state.suggestedLabel}
        </Button>
      ) : (
        <Link to="/soldi/chiusura" className="shrink-0 w-full sm:w-auto">
          <Button fullWidth>Vedi il riepilogo</Button>
        </Link>
      )}
    </div>
  );
}
