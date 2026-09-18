import { useState } from 'react';
import { Plus, Edit2, Trash2, CalendarClock } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import {
  Button,
  IconButton,
  Card,
  Sheet,
  Field,
  Select,
  Toggle,
  MoneyInput,
  EmptyState,
  Money,
} from '@/ui';
import type { RecurringExpense } from '@/data/types';
import { recurringExpenseSchema } from '@/data/schemas';
import { newBase, nowInstant } from '@/lib/record';

interface FormState {
  name: string;
  amount: number;
  dayOfMonth: number;
  bucketId: string;
  createsTask: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  amount: 0,
  dayOfMonth: 1,
  bucketId: '',
  createsTask: false,
};

export function RecurringExpensesScreen() {
  const expenses = useDataStore((state) => state.recurringExpenses);
  const buckets = useDataStore((state) => state.buckets);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);
  const restoreItem = useDataStore((state) => state.restoreItem);
  const addToast = useToastStore((state) => state.addToast);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bucketOptions = buckets.map((bucket) => ({ value: bucket.id, label: bucket.name }));
  const bucketName = (id: string) => buckets.find((b) => b.id === id)?.name ?? 'Bucket rimosso';

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, bucketId: buckets[0]?.id ?? '' });
    setErrors({});
    setEditingId(null);
    setIsSheetOpen(true);
  };

  const openEdit = (expense: RecurringExpense) => {
    setForm({
      name: expense.name,
      amount: expense.amount,
      dayOfMonth: expense.dayOfMonth,
      bucketId: expense.bucketId,
      createsTask: expense.createsTask,
    });
    setErrors({});
    setEditingId(expense.id);
    setIsSheetOpen(true);
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      await removeItem('recurringExpenses', id);
      addToast('Hai eliminato "' + name + '".', 'info', {
        label: 'Annulla',
        onClick: () => {
          void restoreItem('recurringExpenses', id);
        },
      });
    } catch {
      // The store already reported the failure.
    }
  };

  const handleSave = async () => {
    const draft = {
      name: form.name,
      amount: form.amount,
      dayOfMonth: form.dayOfMonth,
      bucketId: form.bucketId,
      createsTask: form.createsTask,
      isActive: true,
    };

    const parsed = recurringExpenseSchema
      .omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true })
      .safeParse(draft);

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key !== undefined) nextErrors[String(key)] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    try {
      if (editingId) {
        await updateItem('recurringExpenses', editingId, {
          ...parsed.data,
          updatedAt: nowInstant(),
        });
      } else {
        await createItem('recurringExpenses', { ...newBase(), ...parsed.data });
      }
      setIsSheetOpen(false);
      addToast('Spesa ricorrente salvata.', 'success');
    } catch {
      // The store already reported the failure.
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Spese ricorrenti</h1>
          <p className="text-sm text-muted-foreground">
            Le uscite che tornano ogni mese, con il bucket da cui escono.
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="hidden sm:inline-flex shrink-0">
          <Plus size={16} className="mr-2" aria-hidden="true" /> Nuova
        </Button>
      </header>

      {buckets.length === 0 && (
        <Card className="text-sm text-muted-foreground">
          Prima crea almeno un bucket: una spesa ricorrente deve sapere da dove esce il soldo.
        </Card>
      )}

      {expenses.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nessuna spesa ricorrente"
          description="Affitto, bollette, palestra: registra la prima e sapremo cosa aspettarci ogni ciclo."
          action={
            <Button onClick={openCreate} disabled={buckets.length === 0}>
              Registra la prima
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {expenses.map((expense) => (
            <li key={expense.id}>
              <Card className="flex items-center justify-between gap-4" padding="sm">
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground truncate">{expense.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Il {expense.dayOfMonth} · {bucketName(expense.bucketId)}
                    {expense.createsTask ? ' · crea un task' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Money cents={expense.amount} className="font-semibold" />
                  <IconButton
                    icon={Edit2}
                    label={'Modifica ' + expense.name}
                    size="sm"
                    onClick={() => openEdit(expense)}
                  />
                  <IconButton
                    icon={Trash2}
                    label={'Elimina ' + expense.name}
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleRemove(expense.id, expense.name)}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+108px)] right-4 sm:hidden">
        <Button
          onClick={openCreate}
          variant="primary"
          className="h-14 w-14 rounded-full p-0"
          aria-label="Nuova spesa ricorrente"
        >
          <Plus size={24} aria-hidden="true" />
        </Button>
      </div>

      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingId ? 'Modifica la spesa' : 'Nuova spesa ricorrente'}
      >
        <div className="space-y-4 py-2">
          <Field
            label="Nome (es. Affitto)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <MoneyInput
            label="Importo"
            value={form.amount}
            onChange={(value) => setForm({ ...form, amount: value ?? 0 })}
            error={errors.amount}
          />
          <Field
            label="Giorno del mese"
            type="number"
            min={1}
            max={31}
            value={form.dayOfMonth}
            onChange={(e) => setForm({ ...form, dayOfMonth: Number(e.target.value) || 1 })}
            error={errors.dayOfMonth}
            helpText="Se il mese è più corto, la scadenza slitta all'ultimo giorno."
          />
          <Select
            label="Bucket"
            options={bucketOptions}
            value={form.bucketId}
            onChange={(e) => setForm({ ...form, bucketId: e.target.value })}
            error={errors.bucketId}
          />
          <Toggle
            label="Crea un task alla scadenza"
            description="Utile per le spese che richiedono un'azione, come un bonifico."
            checked={form.createsTask}
            onChange={(e) => setForm({ ...form, createsTask: e.target.checked })}
          />

          <div className="pt-2 flex gap-3">
            <Button className="flex-1" onClick={() => void handleSave()}>
              Salva la spesa
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
