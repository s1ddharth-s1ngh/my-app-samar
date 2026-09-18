import { useState, useEffect } from 'react';
import { Sheet, Button } from '@/ui';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';

export function TimerModal({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const task = useDataStore((state) => state.tasks).find((t) => t.id === taskId);
  const updateItem = useDataStore((state) => state.updateItem);
  const addToast = useToastStore((state) => state.addToast);

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = window.setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!task || !task.timer) return null;

  const target = task.timer.targetSeconds;
  const min = task.timer.minSeconds;

  const handleStop = async () => {
    setIsRunning(false);

    // Check if reached minimum
    if (elapsed >= min) {
      await updateItem('tasks', task.id, {
        status: 'done',
        completedAt: new Date().toISOString(),
      });
      addToast('Obiettivo raggiunto, task completato!', 'success');
      onClose();
    } else {
      addToast(
        `Hai fatto ${Math.floor(elapsed / 60)} min. Non abbastanza per completarlo!`,
        'info'
      );
      onClose();
    }
  };

  const mins = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');

  const targetMins = Math.floor(target / 60);

  return (
    <Sheet isOpen={!!taskId} onClose={onClose} title={`Timer: ${task.title}`}>
      <div className="flex flex-col items-center py-12 space-y-8">
        <div className="text-6xl font-bold tabular-nums ">
          {mins}:{secs}
        </div>
        <div className="text-sm text-muted-foreground">Target: {targetMins} min</div>

        <div className="flex gap-4">
          <Button size="lg" onClick={() => setIsRunning(!isRunning)} className="w-32">
            {isRunning ? 'Pausa' : 'Avvia'}
          </Button>
          <Button size="lg" variant="secondary" onClick={handleStop} className="w-32">
            Ferma
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
