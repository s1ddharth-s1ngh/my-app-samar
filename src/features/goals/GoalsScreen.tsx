import { useMemo, useState } from 'react';
import { Check, Edit2, Plus, Target, Trash2, Undo2 } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button, Card, CardHeader, Chip, EmptyState, IconButton, PageHeader } from '@/ui';
import { ROW_DIVIDE } from '@/lib/surfaces';
import { todayCalendarDate } from '@/domain/cycles';
import { daysToDeadline, deadlineLabel, isGoal } from '@/domain/goals';
import { nowInstant } from '@/lib/record';
import type { Task } from '@/data/types';
import { GoalSheet } from './GoalSheet';
import { cadenceLabel } from './goalModel';

type Group = 'open' | 'late' | 'reached';

const GROUPS: { key: Group; title: string; subtitle: string }[] = [
  { key: 'open', title: 'In corso', subtitle: 'Hanno ancora tempo.' },
  { key: 'late', title: 'Scadute', subtitle: 'La data è passata e non le hai chiuse.' },
  { key: 'reached', title: 'Raggiunte', subtitle: 'Fatte.' },
];

export function GoalsScreen() {
  const tasks = useDataStore((state) => state.tasks);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);
  const restoreItem = useDataStore((state) => state.restoreItem);
  const addToast = useToastStore((state) => state.addToast);

  const [editing, setEditing] = useState<Task | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const today = todayCalendarDate();

  const grouped = useMemo(() => {
    const goals = tasks.filter(isGoal);
    const sorted = [...goals].sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? ''));

    return {
      open: sorted.filter((g) => g.status !== 'done' && (daysToDeadline(g, today) ?? 0) >= 0),
      late: sorted.filter((g) => g.status !== 'done' && (daysToDeadline(g, today) ?? 0) < 0),
      reached: sorted.filter((g) => g.status === 'done'),
    };
  }, [tasks, today]);

  const open = (goal: Task | null) => {
    setEditing(goal);
    setIsSheetOpen(true);
  };

  const toggleReached = async (goal: Task) => {
    const done = goal.status === 'done';
    try {
      await updateItem('tasks', goal.id, {
        status: done ? 'todo' : 'done',
        completedAt: done ? null : nowInstant(),
        updatedAt: nowInstant(),
      });
    } catch {
      // The store already reported the failure.
    }
  };

  const handleRemove = async (goal: Task) => {
    try {
      await removeItem('tasks', goal.id);
      addToast(`Hai eliminato "${goal.title}".`, 'info', {
        label: 'Annulla',
        onClick: () => {
          void restoreItem('tasks', goal.id);
        },
      });
    } catch {
      // The store already reported the failure.
    }
  };

  const total = grouped.open.length + grouped.late.length + grouped.reached.length;

  return (
    <div className="space-y-3">
      <PageHeader
        title="Obiettivi"
        subtitle="Una data, e i promemoria che ti ci portano."
        actions={
          <Button onClick={() => open(null)}>
            <Plus size={14} className="mr-1.5" aria-hidden="true" /> Nuovo
          </Button>
        }
      />

      {total === 0 ? (
        <EmptyState
          icon={Target}
          title="Nessun obiettivo"
          description="Scrivi cosa vuoi fare e entro quando. Poi scegli quando ti devo ricordare di farlo."
          actions={<Button onClick={() => open(null)}>Scrivi il primo</Button>}
        />
      ) : (
        GROUPS.map(({ key, title, subtitle }) => {
          const goals = grouped[key];
          if (goals.length === 0) return null;

          return (
            <Card key={key}>
              <CardHeader title={title} subtitle={subtitle} />
              <div className={ROW_DIVIDE}>
                {goals.map((goal) => {
                  const days = daysToDeadline(goal, today) ?? 0;
                  const reached = goal.status === 'done';

                  return (
                    <div key={goal.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`truncate text-[13px] font-semibold ${
                              reached ? 'text-white/35 line-through' : 'text-white'
                            }`}
                          >
                            {goal.title}
                          </span>
                          {!reached && (
                            <Chip variant={key === 'late' ? 'bad' : days <= 3 ? 'warn' : 'neutral'}>
                              {deadlineLabel(days)}
                            </Chip>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-white/45">
                          {reached ? 'Raggiunto.' : cadenceLabel(goal)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <IconButton
                          icon={reached ? Undo2 : Check}
                          label={reached ? `Riapri ${goal.title}` : `Segna raggiunto ${goal.title}`}
                          size="sm"
                          onClick={() => void toggleReached(goal)}
                        />
                        <IconButton
                          icon={Edit2}
                          label={`Modifica ${goal.title}`}
                          size="sm"
                          onClick={() => open(goal)}
                        />
                        <IconButton
                          icon={Trash2}
                          label={`Elimina ${goal.title}`}
                          size="sm"
                          variant="danger"
                          onClick={() => void handleRemove(goal)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })
      )}

      {isSheetOpen && (
        <GoalSheet
          key={editing?.id ?? 'new'}
          goal={editing}
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
        />
      )}
    </div>
  );
}
