import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Clock, Plus } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button, EmptyState, Field, PageHeader, Select, Sheet } from '@/ui';
import type { Task, TaskKind } from '@/data/types';
import { nowInstant } from '@/lib/record';
import { TaskRow } from '../tasks/TaskRow';
import { TaskEditorSheet } from '../tasks/TaskEditorSheet';
import { newTask, nextOrder } from '../tasks/taskModel';
import { TimerModal } from './TimerModal';

const INBOX = 'inbox';

function isTimedKind(value: string): value is Extract<TaskKind, 'timed' | 'habit'> {
  return value === 'timed' || value === 'habit';
}

export function ProjectDetailsScreen() {
  const { id } = useParams<{ id: string }>();
  const projects = useDataStore((state) => state.projects);
  const tasks = useDataStore((state) => state.tasks);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);
  const restoreItem = useDataStore((state) => state.restoreItem);
  const addToast = useToastStore((state) => state.addToast);

  const [quickTitle, setQuickTitle] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState({ title: '', kind: 'timed' as TaskKind, minutes: 25 });

  const isInbox = id === INBOX;
  const project = isInbox ? null : projects.find((item) => item.id === id && !item.deletedAt);
  const projectId = isInbox ? null : (id ?? null);

  if (!isInbox && !project) {
    return (
      <div className="space-y-6">
        <PageHeader title="Progetto" breadcrumb={{ to: '/progetti', label: 'Progetti' }} />
        <EmptyState
          icon={Check}
          title="Progetto non trovato"
          description="Potrebbe essere stato archiviato o eliminato."
        />
      </div>
    );
  }

  const projectTasks = tasks
    .filter((task) => task.projectId === projectId && !task.deletedAt)
    .sort((a, b) => a.order - b.order);

  const open = projectTasks.filter((task) => task.status !== 'done');
  const done = projectTasks.filter((task) => task.status === 'done');

  const handleQuickCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (quickTitle.trim() === '') return;

    await createItem(
      'tasks',
      newTask({
        title: quickTitle.trim(),
        projectId,
        order: nextOrder(tasks, projectId),
      })
    );
    setQuickTitle('');
  };

  const handleAdvancedCreate = async () => {
    if (advanced.title.trim() === '') return;
    const seconds = Math.max(1, advanced.minutes) * 60;

    await createItem(
      'tasks',
      newTask({
        title: advanced.title.trim(),
        projectId,
        kind: advanced.kind,
        order: nextOrder(tasks, projectId),
        timer: { targetSeconds: seconds, minSeconds: seconds },
      })
    );

    setAdvanced({ title: '', kind: 'timed', minutes: 25 });
    setIsAdvancedOpen(false);
  };

  const handleToggle = async (task: Task) => {
    const isDone = task.status !== 'done';
    await updateItem('tasks', task.id, {
      status: isDone ? 'done' : 'todo',
      completedAt: isDone ? nowInstant() : null,
      updatedAt: nowInstant(),
    });
  };

  const handleRemove = async (task: Task) => {
    try {
      await removeItem('tasks', task.id);
      addToast(`Hai eliminato "${task.title}".`, 'info', {
        label: 'Annulla',
        onClick: () => {
          void restoreItem('tasks', task.id);
        },
      });
    } catch {
      // The store already reported the failure.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isInbox ? 'Inbox' : (project?.name ?? '')}
        subtitle={
          isInbox ? 'Task senza progetto' : (project?.description ?? `${open.length} da fare`)
        }
        breadcrumb={{ to: '/progetti', label: 'Progetti' }}
      />

      <form onSubmit={(event) => void handleQuickCreate(event)} className="flex gap-2 items-end">
        <Field
          label="Nuovo task"
          className="flex-1"
          placeholder="Scrivi e premi Invio"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
        />
        <Button type="submit" disabled={quickTitle.trim() === ''} aria-label="Aggiungi il task">
          <Plus size={18} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="quiet"
          onClick={() => setIsAdvancedOpen(true)}
          aria-label="Nuovo task a tempo"
        >
          <Clock size={18} aria-hidden="true" />
        </Button>
      </form>

      {open.length === 0 && done.length === 0 ? (
        <EmptyState
          icon={Check}
          title="Nessun task"
          description="Scrivi il primo qui sopra: bastano il titolo e Invio."
        />
      ) : (
        <ul className="space-y-2">
          {open.map((task) => (
            <li key={task.id}>
              <TaskRow
                task={task}
                onToggle={(item) => void handleToggle(item)}
                onEdit={setEditingTask}
                onRemove={(item) => void handleRemove(item)}
                onStartTimer={(item) => setTimerTaskId(item.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <details className="space-y-2">
          <summary className="kpi-label cursor-pointer py-2">Completati ({done.length})</summary>
          <ul className="space-y-2">
            {done.map((task) => (
              <li key={task.id}>
                <TaskRow
                  task={task}
                  onToggle={(item) => void handleToggle(item)}
                  onRemove={(item) => void handleRemove(item)}
                />
              </li>
            ))}
          </ul>
        </details>
      )}

      <Sheet
        isOpen={isAdvancedOpen}
        onClose={() => setIsAdvancedOpen(false)}
        title="Nuovo task a tempo"
      >
        <div className="space-y-4 py-2">
          <Field
            label="Titolo"
            value={advanced.title}
            onChange={(e) => setAdvanced({ ...advanced, title: e.target.value })}
          />
          <Select
            label="Tipo"
            value={advanced.kind}
            onChange={(e) => {
              if (isTimedKind(e.target.value)) setAdvanced({ ...advanced, kind: e.target.value });
            }}
            options={[
              { value: 'timed', label: 'A tempo (es. pomodoro)' },
              { value: 'habit', label: 'Abitudine con minimo giornaliero' },
            ]}
          />
          <Field
            label={advanced.kind === 'habit' ? 'Minuti minimi al giorno' : 'Minuti obiettivo'}
            type="number"
            min={1}
            value={advanced.minutes}
            onChange={(e) => setAdvanced({ ...advanced, minutes: Number(e.target.value) || 1 })}
          />
          <div className="pt-2 flex gap-3">
            <Button
              className="flex-1"
              onClick={() => void handleAdvancedCreate()}
              disabled={advanced.title.trim() === ''}
            >
              Crea il task
            </Button>
            <Button variant="quiet" onClick={() => setIsAdvancedOpen(false)}>
              Annulla
            </Button>
          </div>
        </div>
      </Sheet>

      <TaskEditorSheet
        key={editingTask?.id ?? 'none'}
        task={editingTask}
        onClose={() => setEditingTask(null)}
      />

      <TimerModal
        key={timerTaskId ?? 'none'}
        taskId={timerTaskId}
        onClose={() => setTimerTaskId(null)}
      />
    </div>
  );
}
