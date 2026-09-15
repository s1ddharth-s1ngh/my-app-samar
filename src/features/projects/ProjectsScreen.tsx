import { useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button, IconButton, Card, Sheet, Field, Select, EmptyState } from '@/ui';
import { Plus, Edit2, Trash2, Folder, GripVertical } from 'lucide-react';
import type { Project } from '@/data/types';
import { projectSchema } from '@/data/schemas';
import { useNavigate } from 'react-router-dom';

type FormState = {
  name: string;
  description: string;
  color: string;
  icon: string;
  status: string;
};

export default function ProjectsScreen() {
  const projects = useDataStore((state) => state.projects).sort((a, b) => a.order - b.order);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);
  const restoreItem = useDataStore((state) => state.restoreItem);
  const addToast = useToastStore((state) => state.addToast);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: '📁',
    status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleOpenCreate = () => {
    setForm({ name: '', description: '', color: '#3b82f6', icon: '📁', status: 'active' });
    setErrors({});
    setEditingId(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setForm({
      name: proj.name,
      description: proj.description || '',
      color: proj.color,
      icon: proj.icon,
      status: proj.status,
    });
    setErrors({});
    setEditingId(proj.id);
    setIsSheetOpen(true);
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      await removeItem('projects', id);
      const onUndo = async () => {
        try {
          await restoreItem('projects', id);
          addToast(`"${name}" ripristinato.`, 'success');
        } catch {
          addToast(`Errore nel ripristino.`, 'error');
        }
      };
      addToast(`Hai eliminato "${name}".`, 'info', { label: 'Annulla', onClick: onUndo });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        color: form.color,
        icon: form.icon,
        status: form.status as any,
        order: editingId ? (projects.find((p) => p.id === editingId)?.order ?? 0) : projects.length,
      };

      const parsed = projectSchema
        .omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true })
        .safeParse(payload);
      if (!parsed.success) {
        const newErrors: Record<string, string> = {};
        parsed.error.issues.forEach((i) => {
          if (i.path[0]) newErrors[i.path[0].toString()] = i.message;
        });
        setErrors(newErrors);
        return;
      }

      if (editingId) {
        await updateItem('projects', editingId, parsed.data);
      } else {
        await createItem('projects', {
          id: crypto.randomUUID(),
          ...parsed.data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        });
      }
      setIsSheetOpen(false);
      addToast('Salvato con successo.', 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      const el = document.getElementById(`proj-${id}`);
      if (el) el.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (_e: React.DragEvent, id: string) => {
    setDraggedId(null);
    const el = document.getElementById(`proj-${id}`);
    if (el) el.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === dropId) return;

    const dragIndex = projects.findIndex((p) => p.id === draggedId);
    const dropIndex = projects.findIndex((p) => p.id === dropId);

    if (dragIndex === -1 || dropIndex === -1) return;

    const newProjects = [...projects];
    const [removed] = newProjects.splice(dragIndex, 1);
    if (!removed) return;

    newProjects.splice(dropIndex, 0, removed);

    for (let i = 0; i < newProjects.length; i++) {
      const proj = newProjects[i];
      if (proj && proj.order !== i) {
        await updateItem('projects', proj.id, { order: i });
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 pb-32">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Progetti</h1>
          <p className="text-sm text-zinc-500">Gestisci i tuoi obiettivi e task</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="hidden sm:inline-flex">
          <Plus size={16} className="mr-2" /> Nuovo
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="Nessun progetto"
          description="Crea il tuo primo progetto per iniziare a organizzare i task."
          action={<Button onClick={handleOpenCreate}>Crea progetto</Button>}
        />
      ) : (
        <div className="space-y-3">
          {projects.map((proj) => (
            <Card
              id={`proj-${proj.id}`}
              key={proj.id}
              className="flex items-center p-3 gap-3 cursor-move hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, proj.id)}
              onDragEnd={(e) => handleDragEnd(e, proj.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, proj.id)}
              onClick={() => navigate(`/progetti/${proj.id}`)}
            >
              <div
                className="text-zinc-400 cursor-grab active:cursor-grabbing shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical size={20} />
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
                style={{ backgroundColor: `${proj.color}20`, color: proj.color }}
              >
                {proj.icon}
              </div>
              <div className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{proj.name}</h3>
                  {proj.status === 'paused' && (
                    <span className="text-[10px] uppercase font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                      In pausa
                    </span>
                  )}
                  {proj.status === 'done' && (
                    <span className="text-[10px] uppercase font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      Fatto
                    </span>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{proj.description}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <IconButton
                  icon={Edit2}
                  label="Modifica"
                  size="sm"
                  onClick={() => handleOpenEdit(proj)}
                />
                <IconButton
                  icon={Trash2}
                  label="Elimina"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemove(proj.id, proj.name)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <div className="fixed bottom-20 right-4 sm:hidden">
        <Button onClick={handleOpenCreate} className="h-14 w-14 rounded-full shadow-lg p-0">
          <Plus size={24} />
        </Button>
      </div>

      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingId ? 'Modifica Progetto' : 'Nuovo Progetto'}
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
            options={[
              { value: 'active', label: 'Attivo' },
              { value: 'paused', label: 'In pausa' },
              { value: 'done', label: 'Completato' },
              { value: 'archived', label: 'Archiviato' },
            ]}
          />

          <Field
            label="Colore (Hex)"
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-16"
          />

          <div className="pt-4 flex gap-3">
            <Button className="flex-1" onClick={handleSave}>
              Salva
            </Button>
            <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>
              Annulla
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
