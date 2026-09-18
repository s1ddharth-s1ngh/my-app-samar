import { useMemo, useState } from 'react';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  KpiCard,
  Money,
  MoneyInput,
  PageHeader,
  Select,
  Sheet,
} from '@/ui';
import type { Transaction } from '@/data/types';
import { transactionSchema } from '@/data/schemas';
import { newBase } from '@/lib/record';
import { parseCalendarDate, todayCalendarDate } from '@/domain/cycles';
import { syncAllocations } from '@/stores/cycleOperations';

const ALL = 'all';

const PERIODS = [
  { value: ALL, label: 'Tutto il ciclo' },
  { value: '7', label: 'Ultimi 7 giorni' },
  { value: '30', label: 'Ultimi 30 giorni' },
];

const DAY_FORMAT = new Intl.DateTimeFormat('it-IT', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
});

interface FormState {
  amount: number;
  description: string;
  bucketId: string;
  date: string;
}

export function TransactionsScreen() {
  const cycles = useDataStore((state) => state.cycles);
  const buckets = useDataStore((state) => state.buckets);
  const transactions = useDataStore((state) => state.transactions);
  const createItem = useDataStore((state) => state.createItem);
  const removeItem = useDataStore((state) => state.removeItem);
  const restoreItem = useDataStore((state) => state.restoreItem);
  const addToast = useToastStore((state) => state.addToast);

  const [bucketFilter, setBucketFilter] = useState(ALL);
  const [periodFilter, setPeriodFilter] = useState(ALL);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeCycle = cycles.find((item) => item.status === 'active' && !item.deletedAt);
  const activeBuckets = buckets
    .filter((bucket) => bucket.isActive && !bucket.deletedAt)
    .sort((a, b) => a.priority - b.priority);

  const bucketName = (id: string | null) =>
    id === null ? 'Senza bucket' : (buckets.find((b) => b.id === id)?.name ?? 'Bucket rimosso');

  const visible = useMemo(() => {
    if (!activeCycle) return [];

    let from = activeCycle.startDate;
    if (periodFilter !== ALL) {
      const days = Number(periodFilter);
      const since = new Date();
      since.setDate(since.getDate() - days + 1);
      const sinceDate = todayCalendarDate(since);
      if (sinceDate > from) from = sinceDate;
    }

    return transactions
      .filter(
        (item) =>
          item.cycleId === activeCycle.id &&
          !item.deletedAt &&
          item.date >= from &&
          (bucketFilter === ALL || item.bucketId === bucketFilter)
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, activeCycle, bucketFilter, periodFilter]);

  const total = visible
    .filter((item) => item.type === 'expense')
    .reduce((acc, item) => acc + item.amount, 0);

  // Movements read best grouped by day.
  const byDay = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const item of visible) {
      const bucket = groups.get(item.date);
      if (bucket) bucket.push(item);
      else groups.set(item.date, [item]);
    }
    return [...groups.entries()];
  }, [visible]);

  const openCreate = () => {
    setForm({
      amount: 0,
      description: '',
      bucketId: activeBuckets[0]?.id ?? '',
      date: todayCalendarDate(),
    });
    setErrors({});
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form || !activeCycle) return;

    const parsed = transactionSchema
      .omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true })
      .safeParse({
        cycleId: activeCycle.id,
        bucketId: form.bucketId === '' ? null : form.bucketId,
        type: 'expense',
        amount: form.amount,
        date: form.date,
        description: form.description.trim(),
        category: null,
        shoppingItemId: null,
        taskId: null,
      });

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
      await createItem('transactions', { ...newBase(), ...parsed.data });
      await syncAllocations(activeCycle.id);
      setIsSheetOpen(false);
      addToast('Movimento registrato.', 'success');
    } catch {
      // The store already reported the failure.
    }
  };

  const handleRemove = async (item: Transaction) => {
    if (!activeCycle) return;
    try {
      await removeItem('transactions', item.id);
      await syncAllocations(activeCycle.id);
      addToast('Movimento eliminato.', 'info', {
        label: 'Annulla',
        onClick: () => {
          void restoreItem('transactions', item.id).then(() => syncAllocations(activeCycle.id));
        },
      });
    } catch {
      // The store already reported the failure.
    }
  };

  if (!activeCycle) {
    return (
      <div className="space-y-6">
        <PageHeader title="Movimenti" backTo="/soldi" backLabel="Soldi" />
        <EmptyState
          icon={Receipt}
          title="Nessun ciclo aperto"
          description="Apri un ciclo dalla schermata Oggi per registrarci i movimenti."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimenti"
        subtitle={activeCycle.label}
        backTo="/soldi"
        backLabel="Soldi"
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" /> Aggiungi
          </Button>
        }
      />

      <KpiCard
        label={bucketFilter === ALL ? 'Speso nel periodo' : `Speso su ${bucketName(bucketFilter)}`}
        value={<Money cents={total} />}
        hint={`${visible.length} ${visible.length === 1 ? 'movimento' : 'movimenti'}`}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Bucket"
          value={bucketFilter}
          onChange={(e) => setBucketFilter(e.target.value)}
          options={[
            { value: ALL, label: 'Tutti i bucket' },
            ...activeBuckets.map((bucket) => ({ value: bucket.id, label: bucket.name })),
          ]}
        />
        <Select
          label="Periodo"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          options={PERIODS}
        />
      </div>

      {byDay.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nessun movimento"
          description="Con questi filtri non c’è niente da mostrare. Registra la prima spesa."
          action={<Button onClick={openCreate}>Registra una spesa</Button>}
        />
      ) : (
        <div className="space-y-5">
          {byDay.map(([date, items]) => (
            <section key={date} className="space-y-2">
              <h2 className="kpi-label">{DAY_FORMAT.format(parseCalendarDate(date))}</h2>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <Card padding="sm" className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{item.description}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {bucketName(item.bucketId)}
                        </p>
                      </div>
                      <Money cents={item.amount} className="font-semibold shrink-0" />
                      <IconButton
                        icon={Trash2}
                        label={`Elimina ${item.description}`}
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleRemove(item)}
                      />
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Sheet
        isOpen={isSheetOpen && form !== null}
        onClose={() => setIsSheetOpen(false)}
        title="Nuovo movimento"
      >
        {form && (
          <div className="space-y-4 py-2">
            <MoneyInput
              label="Importo"
              value={form.amount}
              onChange={(value) => setForm({ ...form, amount: value ?? 0 })}
              error={errors.amount}
            />
            <Field
              label="Descrizione"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              error={errors.description}
              placeholder="es. Spesa al mercato"
            />
            <Select
              label="Bucket"
              value={form.bucketId}
              onChange={(e) => setForm({ ...form, bucketId: e.target.value })}
              options={activeBuckets.map((bucket) => ({ value: bucket.id, label: bucket.name }))}
              error={errors.bucketId}
            />
            <Field
              label="Data"
              type="date"
              value={form.date}
              min={activeCycle.startDate}
              max={activeCycle.endDate}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              error={errors.date}
            />

            <div className="pt-2 flex gap-3">
              <Button className="flex-1" onClick={() => void handleSave()}>
                Registra il movimento
              </Button>
              <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>
                Annulla
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
