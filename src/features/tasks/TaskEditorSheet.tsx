import { useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button, Field, Select, Sheet } from '@/ui';
import type { Task } from '@/data/types';
import { nowInstant } from '@/lib/record';
import {
  PRIORITY_OPTIONS,
  instantToLocalInput,
  localInputToInstant,
  parsePriority,
  parseTags,
} from './taskModel';

const NO_PROJECT = 'inbox';

export interface TaskEditorSheetProps {
  task: Task | null;
  onClose: () => void;
}

interface FormState {
  title: string;
  notes: string;
  projectId: string;
  priority: string;
  dueAt: string;
  tags: string;
}

function toForm(task: Task): FormState {
  return {
    title: task.title,
    notes: task.notes ?? '',
    projectId: task.projectId ?? NO_PROJECT,
    priority: String(task.priority),
    dueAt: instantToLocalInput(task.dueAt),
    tags: task.tags.join(', '),
  };
}

/** The full editor behind the quick-create field: everything a task can carry. */
export function TaskEditorSheet({ task, onClose }: TaskEditorSheetProps) {
  const projects = useDataStore((state) => state.projects);
  const updateItem = useDataStore((state) => state.updateItem);
  const addToast = useToastStore((state) => state.addToast);

  // The caller remounts this sheet per task (see its `key`), so initialising
  // from the prop once is enough — no effect needed to resync.
  const [form, setForm] = useState<FormState | null>(task ? toForm(task) : null);

  const projectOptions = [
    { value: NO_PROJECT, label: 'Nessun progetto (Inbox)' },
    ...projects
      .filter((project) => project.status !== 'archived' && !project.deletedAt)
      .map((project) => ({ value: project.id, label: project.name })),
  ];

  const handleSave = async () => {
    if (!task || !form) return;
    if (form.title.trim() === '') {
      addToast('Il titolo è obbligatorio.', 'error');
      return;
    }

    try {
      await updateItem('tasks', task.id, {
        title: form.title.trim(),
        notes: form.notes.trim() === '' ? null : form.notes.trim(),
        projectId: form.projectId === NO_PROJECT ? null : form.projectId,
        priority: parsePriority(form.priority),
        dueAt: localInputToInstant(form.dueAt),
        tags: parseTags(form.tags),
        updatedAt: nowInstant(),
      });
      onClose();
      addToast('Task aggiornato.', 'success');
    } catch {
      // The store already reported the failure.
    }
  };

  return (
    <Sheet isOpen={task !== null && form !== null} onClose={onClose} title="Modifica il task">
      {form && (
        <div className="space-y-4 py-2">
          <Field
            label="Titolo"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Field
            label="Note"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Facoltative"
          />
          <Select
            label="Progetto"
            options={projectOptions}
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          />
          <Select
            label="Priorità"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          />
          <Field
            label="Scadenza"
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            helpText="Lascia vuoto se non ha una data."
          />
          <Field
            label="Tag"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="casa, urgente"
            helpText="Separati da virgola."
          />

          <div className="pt-2 flex gap-3">
            <Button className="flex-1" onClick={() => void handleSave()}>
              Salva il task
            </Button>
            <Button variant="quiet" onClick={onClose}>
              Annulla
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
