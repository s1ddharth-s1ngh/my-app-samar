import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '@/stores/useDataStore';
import { Button, Field, IconButton, Card, EmptyState, Sheet, Select } from '@/ui';
import { Plus, Check, ChevronLeft, Trash2, GripVertical, Clock, Play } from 'lucide-react';
import type { TaskKind } from '@/data/types';
import { TimerModal } from './TimerModal';

export function ProjectDetailsScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projects = useDataStore((state) => state.projects);
  const tasks = useDataStore((state) => state.tasks);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [isAdvancedSheetOpen, setIsAdvancedSheetOpen] = useState(false);
  const [advForm, setAdvForm] = useState<{ title: string; kind: TaskKind; minutes: number }>({
    title: '',
    kind: 'timed',
    minutes: 25,
  });

  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);

  const isInbox = id === 'inbox';
  const project = isInbox ? null : projects.find((p) => p.id === id);

  if (!isInbox && !project) {
    return <div className="p-4">Progetto non trovato.</div>;
  }

  const projectTasks = tasks
    .filter((t) => (isInbox ? t.projectId === null : t.projectId === id))
    .sort((a, b) => a.order - b.order);

  const handleCreateTask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskTitle.trim()) return;

    await createItem('tasks', {
      id: crypto.randomUUID(),
      projectId: isInbox ? null : id!,
      title: newTaskTitle.trim(),
      notes: null,
      kind: 'simple',
      status: 'todo',
      priority: 0,
      dueAt: null,
      order: projectTasks.length,
      tags: [],
      recurrence: null,
      timer: null,
      shoppingItemId: null,
      reminders: [],
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    setNewTaskTitle('');
  };

  const handleCreateAdvancedTask = async () => {
    if (!advForm.title.trim()) return;

    await createItem('tasks', {
      id: crypto.randomUUID(),
      projectId: isInbox ? null : id!,
      title: advForm.title.trim(),
      notes: null,
      kind: advForm.kind,
      status: 'todo',
      priority: 0,
      dueAt: null,
      order: projectTasks.length,
      tags: [],
      recurrence: null,
      timer: {
        targetSeconds: advForm.minutes * 60,
        minSeconds: advForm.kind === 'habit' ? advForm.minutes * 60 : advForm.minutes * 60,
      },
      shoppingItemId: null,
      reminders: [],
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });

    setAdvForm({ title: '', kind: 'timed', minutes: 25 });
    setIsAdvancedSheetOpen(false);
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    await updateItem('tasks', taskId, {
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date().toISOString() : null,
    });
  };

  const handleRemove = async (taskId: string) => {
    await removeItem('tasks', taskId);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      const el = document.getElementById(`task-${taskId}`);
      if (el) el.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (_e: React.DragEvent, taskId: string) => {
    setDraggedId(null);
    const el = document.getElementById(`task-${taskId}`);
    if (el) el.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === dropId) return;

    const dragIndex = projectTasks.findIndex((t) => t.id === draggedId);
    const dropIndex = projectTasks.findIndex((t) => t.id === dropId);

    if (dragIndex === -1 || dropIndex === -1) return;

    const newTasks = [...projectTasks];
    const [removed] = newTasks.splice(dragIndex, 1);
    if (!removed) return;
    newTasks.splice(dropIndex, 0, removed);

    for (let i = 0; i < newTasks.length; i++) {
      const task = newTasks[i];
      if (task && task.order !== i) {
        await updateItem('tasks', task.id, { order: i });
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 pb-32">
      <div className="flex items-center gap-4">
        <IconButton icon={ChevronLeft} label="Indietro" onClick={() => navigate('/progetti')} />
        <div className="flex items-center gap-3">
          {project && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${project.color}20`, color: project.color }}
            >
              {project.icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{isInbox ? 'Inbox' : project?.name}</h1>
            {!isInbox && project?.description && (
              <p className="text-sm text-zinc-500">{project.description}</p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleCreateTask} className="flex gap-2 items-end">
        <div className="flex-1">
          <Field
            label="Nuovo task rapido"
            placeholder="Aggiungi un nuovo task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={!newTaskTitle.trim()} className="shrink-0 h-12">
          <Plus size={20} />
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 h-12 px-3"
          onClick={() => setIsAdvancedSheetOpen(true)}
        >
          <Clock size={20} />
        </Button>
      </form>

      <Sheet
        isOpen={isAdvancedSheetOpen}
        onClose={() => setIsAdvancedSheetOpen(false)}
        title="Nuovo Task Avanzato"
      >
        <div className="space-y-4 py-4">
          <Field
            label="Titolo"
            value={advForm.title}
            onChange={(e) => setAdvForm({ ...advForm, title: e.target.value })}
          />
          <Select
            label="Tipo"
            value={advForm.kind}
            onChange={(e) => setAdvForm({ ...advForm, kind: e.target.value as any })}
            options={[
              { value: 'timed', label: 'A Tempo (es. Pomodoro)' },
              { value: 'habit', label: 'Abitudine (Target minimo)' },
            ]}
          />
          <Field
            label={advForm.kind === 'habit' ? 'Minuti minimi' : 'Minuti target'}
            type="number"
            min={1}
            value={advForm.minutes}
            onChange={(e) => setAdvForm({ ...advForm, minutes: parseInt(e.target.value) || 1 })}
          />
          <div className="pt-4 flex gap-3">
            <Button
              className="flex-1"
              onClick={handleCreateAdvancedTask}
              disabled={!advForm.title.trim()}
            >
              Crea
            </Button>
            <Button variant="secondary" onClick={() => setIsAdvancedSheetOpen(false)}>
              Annulla
            </Button>
          </div>
        </div>
      </Sheet>

      {projectTasks.length === 0 ? (
        <EmptyState
          icon={Check}
          title="Tutto fatto!"
          description="Non ci sono task in questa lista."
        />
      ) : (
        <div className="space-y-2">
          {projectTasks.map((task) => (
            <Card
              key={task.id}
              id={`task-${task.id}`}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragEnd={(e) => handleDragEnd(e, task.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, task.id)}
              className={`flex items-center p-3 gap-3 transition-colors ${
                task.status === 'done'
                  ? 'opacity-60 bg-zinc-50 dark:bg-zinc-900/50'
                  : 'hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="text-zinc-300 cursor-grab active:cursor-grabbing shrink-0">
                <GripVertical size={20} />
              </div>

              <button
                onClick={() => handleToggleStatus(task.id, task.status)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                  task.status === 'done'
                    ? 'bg-accent border-accent text-white'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-accent'
                }`}
              >
                {task.status === 'done' && <Check size={14} strokeWidth={3} />}
              </button>

              <div
                className={`flex-1 ${task.status === 'done' ? 'line-through text-zinc-500' : ''}`}
              >
                {task.title}
              </div>

              {task.kind !== 'simple' && task.timer && (
                <div className="shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => setActiveTimerTaskId(task.id)}
                  >
                    <Play size={14} className="ml-0.5" />
                  </Button>
                </div>
              )}

              <div className="shrink-0">
                <IconButton
                  icon={Trash2}
                  label="Elimina"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemove(task.id)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
      <TimerModal
        key={activeTimerTaskId || 'none'}
        taskId={activeTimerTaskId}
        onClose={() => setActiveTimerTaskId(null)}
      />
    </div>
  );
}
