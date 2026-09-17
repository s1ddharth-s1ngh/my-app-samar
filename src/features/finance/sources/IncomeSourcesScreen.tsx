import { useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button, IconButton, Card, Sheet, Field, MoneyInput, EmptyState } from '@/ui';
import { Plus, Edit2, Trash2, Wallet } from 'lucide-react';
import type { IncomeSource } from '@/data/types';
import { incomeSourceSchema } from '@/data/schemas';

// Minimal form state
type FormState = {
  name: string;
  expectedAmount: number | null;
  expectedDay: number;
};

export function IncomeSourcesScreen() {
  const sources = useDataStore((state) => state.incomeSources);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);
  const restoreItem = useDataStore((state) => state.restoreItem);
  const addToast = useToastStore((state) => state.addToast);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', expectedAmount: null, expectedDay: 1 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenCreate = () => {
    setForm({ name: '', expectedAmount: null, expectedDay: 1 });
    setErrors({});
    setEditingId(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (source: IncomeSource) => {
    setForm({
      name: source.name,
      expectedAmount: source.expectedAmount,
      expectedDay: source.expectedDay ?? 1,
    });
    setErrors({});
    setEditingId(source.id);
    setIsSheetOpen(true);
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      await removeItem('incomeSources', id);
      const onUndo = async () => {
        try {
          await restoreItem('incomeSources', id);
          addToast(`"${name}" ripristinato.`, 'success');
        } catch {
          addToast(`Errore nel ripristino di "${name}".`, 'error');
        }
      };
      addToast(`Hai eliminato "${name}".`, 'info', {
        label: 'Annulla',
        onClick: onUndo,
      });
    } catch {
      // Handled by store
    }
  };

  const handleSave = async () => {
    try {
      // Validate
      const payload = {
        name: form.name,
        expectedAmount: form.expectedAmount,
        expectedDay: form.expectedDay,
        kind: 'salary' as const, // For now hardcoded
        isActive: true,
      };

      const parsed = incomeSourceSchema
        .omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true, color: true })
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
        await updateItem('incomeSources', editingId, {
          name: parsed.data.name,
          expectedAmount: parsed.data.expectedAmount,
          expectedDay: parsed.data.expectedDay,
        });
      } else {
        await createItem('incomeSources', {
          id: crypto.randomUUID(),
          name: parsed.data.name,
          expectedAmount: parsed.data.expectedAmount,
          expectedDay: parsed.data.expectedDay,
          kind: parsed.data.kind,
          isActive: parsed.data.isActive,
          color: '#10b981', // green default
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        });
      }
      setIsSheetOpen(false);
      addToast('Salvato con successo.', 'success');
    } catch {
      // Store handles toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fonti di Entrata</h1>
          <p className="text-sm text-ink-muted">Gestisci da dove arrivano i tuoi soldi</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="hidden sm:inline-flex">
          <Plus size={16} className="mr-2" /> Nuova
        </Button>
      </div>

      {sources.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nessuna fonte di entrata"
          description="Aggiungi il tuo stipendio, rendite o altre entrate ricorrenti."
          action={<Button onClick={handleOpenCreate}>Crea la prima</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sources.map((source) => (
            <Card key={source.id} className="flex flex-col justify-between p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{source.name}</h3>
                  <p className="text-sm text-ink-muted">Giorno {source.expectedDay} del mese</p>
                </div>
                <div className="font-bold text-lg tabular-nums text-success">
                  {source.expectedAmount !== null
                    ? (source.expectedAmount / 100).toLocaleString('it-IT', {
                        style: 'currency',
                        currency: 'EUR',
                      })
                    : 'Variabile'}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t pt-3 border-line">
                <IconButton
                  icon={Edit2}
                  label="Modifica"
                  size="sm"
                  onClick={() => handleOpenEdit(source)}
                />
                <IconButton
                  icon={Trash2}
                  label="Elimina"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemove(source.id, source.name)}
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
        title={editingId ? 'Modifica Fonte' : 'Nuova Fonte'}
      >
        <div className="space-y-4 py-4">
          <Field
            label="Nome (es. Stipendio)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <MoneyInput
            label="Importo atteso"
            value={form.expectedAmount ?? 0}
            onChange={(val) => setForm({ ...form, expectedAmount: val })}
            error={errors.expectedAmount}
          />
          <Field
            label="Giorno del mese (1-31)"
            type="number"
            min={1}
            max={31}
            value={form.expectedDay}
            onChange={(e) => setForm({ ...form, expectedDay: parseInt(e.target.value) || 1 })}
            error={errors.expectedDay}
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
