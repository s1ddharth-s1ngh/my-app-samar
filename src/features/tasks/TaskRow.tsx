import { Check, Clock, Pencil, Play, Trash2 } from 'lucide-react';
import { Card, Chip, IconButton } from '@/ui';
import type { Task } from '@/data/types';
import { PRIORITY_LABELS } from './taskModel';

const DUE_FORMAT = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const PRIORITY_VARIANT: Record<Task['priority'], 'neutral' | 'warn' | 'bad'> = {
  0: 'neutral',
  1: 'neutral',
  2: 'warn',
  3: 'bad',
};

export interface TaskRowProps {
  task: Task;
  /** Shown under the title when the list mixes projects. */
  contextLabel?: string;
  onToggle: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onRemove?: (task: Task) => void;
  onStartTimer?: (task: Task) => void;
  children?: React.ReactNode;
}

export function TaskRow({
  task,
  contextLabel,
  onToggle,
  onEdit,
  onRemove,
  onStartTimer,
  children,
}: TaskRowProps) {
  const isDone = task.status === 'done';
  const isOverdue = task.dueAt !== null && !isDone && new Date(task.dueAt) < new Date();

  return (
    <Card className={`flex items-center gap-3 ${isDone ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={() => onToggle(task)}
        aria-pressed={isDone}
        aria-label={isDone ? `Riapri ${task.title}` : `Completa ${task.title}`}
        className={`h-6 w-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors motion-reduce:transition-none ${
          isDone
            ? 'bg-[#1F523A] border-[#1F523A] text-white'
            : 'border-white/[0.06] hover:border-[#9DB560]'
        }`}
      >
        {isDone && <Check size={14} strokeWidth={3} aria-hidden="true" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate ${isDone ? 'line-through text-white/45' : 'text-white'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 text-sm text-white/45">
          {contextLabel && <span className="truncate">{contextLabel}</span>}
          {task.dueAt && (
            <span className={isOverdue ? 'text-red-300' : undefined}>
              {DUE_FORMAT.format(new Date(task.dueAt))}
            </span>
          )}
          {task.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>

      {task.priority > 0 && (
        <Chip variant={PRIORITY_VARIANT[task.priority]} className="shrink-0 hidden sm:inline-flex">
          {PRIORITY_LABELS[task.priority]}
        </Chip>
      )}

      {children}

      <div className="flex items-center shrink-0">
        {task.timer && onStartTimer && (
          <IconButton
            icon={task.kind === 'habit' ? Clock : Play}
            label={`Avvia il timer di ${task.title}`}
            size="sm"
            onClick={() => onStartTimer(task)}
          />
        )}
        {onEdit && (
          <IconButton
            icon={Pencil}
            label={`Modifica ${task.title}`}
            size="sm"
            onClick={() => onEdit(task)}
          />
        )}
        {onRemove && (
          <IconButton
            icon={Trash2}
            label={`Elimina ${task.title}`}
            size="sm"
            variant="danger"
            onClick={() => onRemove(task)}
          />
        )}
      </div>
    </Card>
  );
}
