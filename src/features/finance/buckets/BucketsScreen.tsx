import { useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button, IconButton, Card, Sheet, Field, Select, EmptyState } from '@/ui';
import { Plus, Edit2, Trash2, GripVertical, Inbox } from 'lucide-react';
import type { Bucket } from '@/data/types';
import { bucketSchema } from '@/data/schemas';

type FormState = {
  name: string;
  icon: string;
  kind: string;
  color: string;
};

export function BucketsScreen() {
  const buckets = useDataStore((state) => state.buckets).sort((a, b) => a.priority - b.priority);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);
  const restoreItem = useDataStore((state) => state.restoreItem);
  const addToast = useToastStore((state) => state.addToast);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '',
    icon: '🏠',
    kind: 'custom',
    color: '#10b981',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setForm({ name: '', icon: '🏠', kind: 'custom', color: '#10b981' });
    setErrors({});
    setEditingId(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (bucket: Bucket) => {
    setForm({
      name: bucket.name,
      icon: bucket.icon,
      kind: bucket.kind,
      color: bucket.color,
    });
    setErrors({});
    setEditingId(bucket.id);
    setIsSheetOpen(true);
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      await removeItem('buckets', id);
      const onUndo = async () => {
        try {
          await restoreItem('buckets', id);
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
        icon: form.icon,
        kind: form.kind as any,
        color: form.color,
        rule: { type: 'remainder' } as const, // Basic default
        priority: editingId
          ? (buckets.find((b) => b.id === editingId)?.priority ?? 0)
          : buckets.length,
        targetAmount: null,
        isActive: true,
      };

      const parsed = bucketSchema
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
        await updateItem('buckets', editingId, {
          name: parsed.data.name,
          icon: parsed.data.icon,
          kind: parsed.data.kind,
          color: parsed.data.color,
        });
      } else {
        await createItem('buckets', {
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
    // Small timeout to allow the drag image to be generated before hiding the original
    setTimeout(() => {
      const el = document.getElementById(`bucket-${id}`);
      if (el) el.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (_e: React.DragEvent, id: string) => {
    setDraggedId(null);
    const el = document.getElementById(`bucket-${id}`);
    if (el) el.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === dropId) return;

    const dragIndex = buckets.findIndex((b) => b.id === draggedId);
    const dropIndex = buckets.findIndex((b) => b.id === dropId);

    if (dragIndex === -1 || dropIndex === -1) return;

    // Create a new array and reorder
    const newBuckets = [...buckets];
    const [removed] = newBuckets.splice(dragIndex, 1);
    if (!removed) return;

    newBuckets.splice(dropIndex, 0, removed);

    for (let i = 0; i < newBuckets.length; i++) {
      const bucket = newBuckets[i];
      if (bucket && bucket.priority !== i) {
        await updateItem('buckets', bucket.id, { priority: i });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bucket</h1>
          <p className="text-sm text-ink-muted">I tuoi contenitori di spesa e risparmio</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="hidden sm:inline-flex">
          <Plus size={16} className="mr-2" /> Nuovo
        </Button>
      </div>

      {buckets.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nessun bucket"
          description="Crea il tuo primo bucket (es. Affitto, Spesa, Risparmi)."
          action={<Button onClick={handleOpenCreate}>Crea il primo</Button>}
        />
      ) : (
        <div className="space-y-3">
          {buckets.map((bucket) => (
            <Card
              id={`bucket-${bucket.id}`}
              key={bucket.id}
              className="flex items-center p-3 gap-3 cursor-move hover:border-line-strong transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, bucket.id)}
              onDragEnd={(e) => handleDragEnd(e, bucket.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, bucket.id)}
            >
              <div className="text-ink-faint cursor-grab active:cursor-grabbing">
                <GripVertical size={20} />
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${bucket.color}20`, color: bucket.color }}
              >
                {bucket.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{bucket.name}</h3>
                <p className="text-xs text-ink-muted capitalize">{bucket.kind}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <IconButton
                  icon={Edit2}
                  label="Modifica"
                  size="sm"
                  onClick={() => handleOpenEdit(bucket)}
                />
                <IconButton
                  icon={Trash2}
                  label="Elimina"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemove(bucket.id, bucket.name)}
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
        title={editingId ? 'Modifica Bucket' : 'Nuovo Bucket'}
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

          <Select
            label="Tipo"
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            options={[
              { value: 'custom', label: 'Personalizzato' },
              { value: 'rent', label: 'Affitto/Mutuo' },
              { value: 'bills', label: 'Bollette' },
              { value: 'spending', label: 'Spese variabili' },
              { value: 'savings', label: 'Risparmi' },
              { value: 'investment', label: 'Investimenti' },
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
