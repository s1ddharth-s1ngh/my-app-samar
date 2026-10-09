import { useEffect, useState } from 'react';
import { Sheet, Button } from '@/ui';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { nowInstant } from '@/lib/record';

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function TimerModal({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const task = useDataStore((state) => state.tasks).find((item) => item.id === taskId);
  const updateItem = useDataStore((state) => state.updateItem);
  const addToast = useToastStore((state) => state.addToast);

  // The wall clock is the source of truth: a background tab throttles the
  // interval, so counting its ticks would lose minutes. Each tick re-reads it.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [bankedMs, setBankedMs] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const read = () => setElapsed(Math.floor((bankedMs + Date.now() - startedAt) / 1000));
    read();
    const interval = window.setInterval(read, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt, bankedMs]);

  if (!task || !task.timer) return null;

  const isRunning = startedAt !== null;
  const { targetSeconds, minSeconds } = task.timer;

  const handleToggleRun = () => {
    if (startedAt === null) {
      setStartedAt(Date.now());
    } else {
      setBankedMs((banked) => banked + Date.now() - startedAt);
      setStartedAt(null);
    }
  };

  const handleStop = async () => {
    setBankedMs(elapsed * 1000);
    setStartedAt(null);

    // ponytail: the session itself is not stored — TimerSession needs the
    // occurrences of FASE 7. Until then only the completion is persisted.
    if (elapsed >= minSeconds) {
      try {
        await updateItem('tasks', task.id, {
          status: 'done',
          completedAt: nowInstant(),
          updatedAt: nowInstant(),
        });
        addToast('Obiettivo raggiunto, task completato!', 'success');
      } catch {
        return; // The store already reported the failure.
      }
    } else {
      addToast(
        `Hai fatto ${Math.floor(elapsed / 60)} min su ${Math.ceil(minSeconds / 60)}: non basta per completarlo.`,
        'info'
      );
    }
    onClose();
  };

  return (
    <Sheet isOpen={taskId !== null} onClose={onClose} title={`Timer: ${task.title}`}>
      <div className="flex flex-col items-center space-y-8 py-12">
        <div className="text-6xl font-bold tabular-nums" role="timer" aria-live="off">
          {formatClock(elapsed)}
        </div>
        <div className="text-sm text-muted-foreground">
          Obiettivo: {Math.round(targetSeconds / 60)} min
          {minSeconds !== targetSeconds && ` · minimo ${Math.ceil(minSeconds / 60)} min`}
        </div>

        <div className="flex gap-4">
          <Button size="md" onClick={handleToggleRun} className="w-32">
            {isRunning ? 'Pausa' : 'Avvia'}
          </Button>
          <Button size="md" variant="quiet" onClick={() => void handleStop()} className="w-32">
            Ferma
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
