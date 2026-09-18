import { useState } from 'react';
import { Plus, Trash2, TrendingUp, Check, Clock } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import {
  Button,
  Card,
  Chip,
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
import type { IncomeEntry } from '@/data/types';
import { incomeEntrySchema } from '@/data/schemas';
import { newBase, nowInstant } from '@/lib/record';
import { todayCalendarDate, clampDayToMonth, parseCalendarDate } from '@/domain/cycles';
import { syncAllocations } from '@/stores/cycleOperations';

interface FormState {
  sourceId: string;
  amount: number;
  date: string;
  note: string;
  status: IncomeEntry['status'];
}

const STATUS_OPTIONS = [
  { value: 'received', label: 'Ricevuta' },
  { value: 'expected', label: 'Prevista' },
];

const DATE_FORMAT = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

function isStatus(value: string): value is IncomeEntry['status'] {
  return value === 'received' || value === 'expected';
}

export function IncomeEntriesScreen() {
  const cycles = useDataStore((state) => state.cycles);
  const sources = useDataStore((state) => state.incomeSources);
  const entries = useDataStore((state) => state.incomeEntries);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);
  const restoreItem = useDataStore((state) => state.restoreItem);
  const addToast = useToastStore((state) => state.addToast);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeCycle = cycles.find((item) => item.status === 'active' && !item.deletedAt);
  const activeSources = sources.filter((source) => source.isActive && !source.deletedAt);

  const cycleEntries = activeCycle
    ? entries
        .filter((entry) => entry.cycleId === activeCycle.id && !entry.deletedAt)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const received = cycleEntries
    .filter((entry) => entry.status === 'received')
    .reduce((acc, entry) => acc + entry.amount, 0);
  const expected = cycleEntries
    .filter((entry) => entry.status === 'expected')
    .reduce((acc, entry) => acc + entry.amount, 0);

  const sourceName = (id: string) =>
    sources.find((source) => source.id === id)?.name ?? 'Fonte rimossa';

  /** Pre-fills from the source: the amount it usually pays, on the day it usually lands. */
  const defaultsForSource = (sourceId: string): FormState => {
    const source = sources.find((item) => item.id === sourceId);
    let date = todayCalendarDate();

    if (source?.expectedDay && activeCycle) {
      const reference = parseCalendarDate(activeCycle.startDate);
      const day = clampDayToMonth(
        reference.getFullYear(),
        reference.getMonth(),
        source.expectedDay
      );
      const candidate = new Date(reference.getFullYear(), reference.getMonth(), day);
      const formatted = todayCalendarDate(candidate);
      // Only use it if it actually falls inside the cycle.
      if (formatted >= activeCycle.startDate && formatted <= activeCycle.endDate) date = formatted;
    }

    return {
      sourceId,
      amount: source?.expectedAmount ?? 0,
      date,
      note: '',
      status: 'received',
    };
  };

  const openCreate = () => {
    const first = activeSources[0];
    if (!first) return;
    setForm(defaultsForSource(first.id));
    setErrors({});
    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form || !activeCycle) return;

    const parsed = incomeEntrySchema
      .omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true })
      .safeParse({
        sourceId: form.sourceId,
        cycleId: activeCycle.id,
        amount: form.amount,
        date: form.date,
        note: form.note.trim() === '' ? null : form.note.trim(),
        status: form.status,
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
      await createItem('incomeEntries', { ...newBase(), ...parsed.data });
      // New income means the unlocked buckets get a new share.
      await syncAllocations(activeCycle.id);
      setIsSheetOpen(false);
      addToast('Entrata registrata. Le allocazioni sono state ricalcolate.', 'success');
    } catch {
      // The store already reported the failure.
    }
  };

  const toggleStatus = async (entry: IncomeEntry) => {
    if (!activeCycle) return;
    await updateItem('incomeEntries', entry.id, {
      status: entry.status === 'received' ? 'expected' : 'received',
      updatedAt: nowInstant(),
    });
    await syncAllocations(activeCycle.id);
  };

  const handleRemove = async (entry: IncomeEntry) => {
    if (!activeCycle) return;
    try {
      await removeItem('incomeEntries', entry.id);
      await syncAllocations(activeCycle.id);
      addToast('Entrata eliminata.', 'info', {
        label: 'Annulla',
        onClick: () => {
          void restoreItem('incomeEntries', entry.id).then(() => syncAllocations(activeCycle.id));
        },
      });
    } catch {
      // The store already reported the failure.
    }
  };

  if (!activeCycle) {
    return (
      <div className="space-y-6">
        <PageHeader title="Entrate" backTo="/soldi" backLabel="Soldi" />
        <EmptyState
          icon={TrendingUp}
          title="Nessun ciclo aperto"
          description="Apri un ciclo dalla schermata Oggi per registrarci le entrate."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entrate"
        subtitle={activeCycle.label}
        backTo="/soldi"
        backLabel="Soldi"
        action={
          <Button size="sm" onClick={openCreate} disabled={activeSources.length === 0}>
            <Plus size={16} aria-hidden="true" /> Registra
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Ricevute" value={<Money cents={received} compact />} tone="success" />
        <KpiCard label="Previste" value={<Money cents={expected} compact />} tone="warning" />
      </div>

      {activeSources.length === 0 && (
        <Card padding="sm" className="text-sm text-muted-foreground">
          Prima crea una fonte di entrata: un movimento in entrata deve sapere da dove arriva.
        </Card>
      )}

      {cycleEntries.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Nessuna entrata in questo ciclo"
          description="Registra la prima: da lì il motore calcola le allocazioni dei bucket."
          action={
            <Button onClick={openCreate} disabled={activeSources.length === 0}>
              Registra la prima
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {cycleEntries.map((entry) => (
            <li key={entry.id}>
              <Card padding="sm" className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">
                    {sourceName(entry.sourceId)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {DATE_FORMAT.format(parseCalendarDate(entry.date))}
                    {entry.note ? ` · ${entry.note}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Money
                    cents={entry.amount}
                    className={`font-semibold ${
                      entry.status === 'expected' ? 'text-muted-foreground' : 'text-foreground'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => void toggleStatus(entry)}
                    title={
                      entry.status === 'received' ? 'Segna come prevista' : 'Segna come ricevuta'
                    }
                  >
                    <Chip variant={entry.status === 'received' ? 'success' : 'warning'}>
                      {entry.status === 'received' ? (
                        <Check size={10} aria-hidden="true" />
                      ) : (
                        <Clock size={10} aria-hidden="true" />
                      )}
                      {entry.status === 'received' ? 'Ricevuta' : 'Prevista'}
                    </Chip>
                  </button>
                  <IconButton
                    icon={Trash2}
                    label={`Elimina l’entrata da ${sourceName(entry.sourceId)}`}
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleRemove(entry)}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        isOpen={isSheetOpen && form !== null}
        onClose={() => setIsSheetOpen(false)}
        title="Nuova entrata"
      >
        {form && (
          <div className="space-y-4 py-2">
            <Select
              label="Fonte"
              options={activeSources.map((source) => ({ value: source.id, label: source.name }))}
              value={form.sourceId}
              onChange={(e) => setForm(defaultsForSource(e.target.value))}
              error={errors.sourceId}
              helpText="Importo e data si compilano da soli con i valori attesi della fonte."
            />
            <MoneyInput
              label="Importo"
              value={form.amount}
              onChange={(value) => setForm({ ...form, amount: value ?? 0 })}
              error={errors.amount}
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
            <Select
              label="Stato"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => {
                if (isStatus(e.target.value)) setForm({ ...form, status: e.target.value });
              }}
              helpText="Una entrata prevista conta nel piano, ma resta distinta da quelle confermate."
            />
            <Field
              label="Nota"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Facoltativa"
            />

            <div className="pt-2 flex gap-3">
              <Button className="flex-1" onClick={() => void handleSave()}>
                Registra l’entrata
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
