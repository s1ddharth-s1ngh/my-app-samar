import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Edit2, Folder, Plus, Trash2 } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import {
  Button,
  Card,
  ColorPicker,
  EmptyState,
  Field,
  IconButton,
  PageHeader,
  Select,
  Sheet,
} from '@/ui';
import type { Project } from '@/data/types';
import { projectSchema } from '@/data/schemas';
import { newBase, nowInstant } from '@/lib/record';
import { ordered, reorder } from './projectModel';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Attivo' },
  { value: 'paused', label: 'In pausa' },
  { value: 'done', label: 'Completato' },
  { value: 'archived', label: 'Archiviato' },
];

const STATUS_LABELS: Record<Project['status'], string | null> = {
  active: null,
  paused: 'In pausa',
  done: 'Fatto',
  archived: 'Archiviato',
};

const EMPTY_FORM = {
  name: '',
  description: '',
  color: '#9db560',
  icon: '📁',
  status: 'active',
};

export default function ProjectsScreen() {
  const projects = useDataStore((state) => state.projects);
  const tasks = useDataStore((state) => state.tasks);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);
  const restoreItem = useDataStore((state) => state.restoreItem);
  const addToast = useToastStore((state) => state.addToast);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const list = ordered(projects);

  const handleOpenCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setForm({
      name: project.name,
      description: project.description ?? '',
      color: project.color,
      icon: project.icon,
      status: project.status,
    });
    setErrors({});
    setEditingId(project.id);
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    const parsed = projectSchema
      .omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true })
      .safeParse({
        name: form.name.trim(),
        description: form.description.trim() === '' ? null : form.description.trim(),
        color: form.color,
        icon: form.icon,
        status: form.status,
        order: editingId ? (projects.find((p) => p.id === editingId)?.order ?? 0) : list.length,
      });

    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0] ?? ''), issue.message])
        )
      );
      return;
    }

    try {
      if (editingId) {
        await updateItem('projects', editingId, { ...parsed.data, updatedAt: nowInstant() });
      } else {
        await createItem('projects', { ...newBase(), ...parsed.data });
      }
      setIsSheetOpen(false);
      addToast('Salvato con successo.', 'success');
    } catch {
      // The store already reported the failure.
    }
  };

  const handleMove = async (id: string, delta: number) => {
    await Promise.all(
      reorder(projects, id, delta).map((row) =>
        updateItem('projects', row.id, { order: row.order, updatedAt: nowInstant() })
      )
    );
  };

  /** A project owns its tasks: deleting one hides both, and undo brings both back. */
  const handleRemove = async (project: Project) => {
    const taskIds = tasks.filter((task) => task.projectId === project.id).map((task) => task.id);

    try {
      await removeItem('projects', project.id);
      await Promise.all(taskIds.map((id) => removeItem('tasks', id)));
    } catch {
      return; // The store already reported the failure.
    }

    addToast(`Hai eliminato "${project.name}".`, 'info', {
      label: 'Annulla',
      onClick: () => {
        void (async () => {
          await restoreItem('projects', project.id);
          await Promise.all(taskIds.map((id) => restoreItem('tasks', id)));
        })();
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progetti"
        subtitle="Gestisci i tuoi obiettivi e task"
        actions={
          <Button onClick={handleOpenCreate} size="sm" className="hidden sm:inline-flex">
            <Plus size={16} className="mr-2" /> Nuovo
          </Button>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="Nessun progetto"
          description="Crea il tuo primo progetto per iniziare a organizzare i task."
          actions={<Button onClick={handleOpenCreate}>Crea progetto</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((project, index) => {
            const open = tasks.filter(
              (task) => task.projectId === project.id && task.status !== 'done'
            ).length;
            const badge = STATUS_LABELS[project.status];

            return (
              <li key={project.id}>
                <Card className="flex items-center gap-3 p-3">
                  <div className="flex flex-col">
                    <IconButton
                      icon={ChevronUp}
                      label={`Sposta ${project.name} in su`}
                      disabled={index === 0}
                      onClick={() => void handleMove(project.id, -1)}
                    />
                    <IconButton
                      icon={ChevronDown}
                      label={`Sposta ${project.name} in giù`}
                      disabled={index === list.length - 1}
                      onClick={() => void handleMove(project.id, 1)}
                    />
                  </div>

                  <Link
                    to={`/progetti/${project.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{ backgroundColor: `${project.color}20`, color: project.color }}
                    >
                      {project.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold text-foreground">
                          {project.name}
                        </span>
                        {badge && <span className="status-chip">{badge}</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {project.description ?? `${open} da fare`}
                      </span>
                    </span>
                  </Link>

                  <div className="flex shrink-0 gap-1">
                    <IconButton
                      icon={Edit2}
                      label={`Modifica ${project.name}`}
                      onClick={() => handleOpenEdit(project)}
                    />
                    <IconButton
                      icon={Trash2}
                      label={`Elimina ${project.name}`}
                      variant="danger"
                      onClick={() => void handleRemove(project)}
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* Mobile FAB */}
      <div className="fixed right-4 bottom-20 md:hidden">
        <Button
          onClick={handleOpenCreate}
          aria-label="Nuovo progetto"
          className="h-14 w-14 rounded-full p-0 shadow-lg"
        >
          <Plus size={24} aria-hidden="true" />
        </Button>
      </div>

      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingId ? 'Modifica progetto' : 'Nuovo progetto'}
      >
        <div className="space-y-4 py-4">
          <div className="flex gap-4">
            <div className="w-20">
              <Field
                label="Icona"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                error={errors.icon}
              />
            </div>
            <div className="flex-1">
              <Field
                label="Nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={errors.name}
              />
            </div>
          </div>

          <Field
            label="Descrizione (opzionale)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            error={errors.description}
          />

          <Select
            label="Stato"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={STATUS_OPTIONS}
          />

          <ColorPicker
            label="Colore"
            value={form.color}
            onChange={(color) => setForm({ ...form, color })}
          />

          <div className="flex gap-3 pt-4">
            <Button className="flex-1" onClick={() => void handleSave()}>
              Salva
            </Button>
            <Button variant="quiet" onClick={() => setIsSheetOpen(false)}>
              Annulla
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
