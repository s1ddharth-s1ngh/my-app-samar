import { useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button, Card, Field, MoneyInput, Select } from '@/ui';
import { todayCalendarDate } from '@/domain/cycles';
import { formatCents } from '@/domain/money';
import { newBase } from '@/lib/record';
import { syncAllocations } from '@/stores/cycleOperations';

/**
 * Registering a spend without leaving the Today screen. The bucket is chosen
 * explicitly: guessing which one pays would hide the decision that matters.
 */
export function QuickSpendForm() {
  const cycles = useDataStore((state) => state.cycles);
  const buckets = useDataStore((state) => state.buckets);
  const allocations = useDataStore((state) => state.allocations);
  const createItem = useDataStore((state) => state.createItem);
  const addToast = useToastStore((state) => state.addToast);

  const [amount, setAmount] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [bucketId, setBucketId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeCycle = cycles.find((item) => item.status === 'active' && !item.deletedAt);
  const activeBuckets = buckets
    .filter((bucket) => bucket.isActive && !bucket.deletedAt)
    .sort((a, b) => a.priority - b.priority);

  if (!activeCycle || activeBuckets.length === 0) return null;

  const selectedId = bucketId || (activeBuckets[0]?.id ?? '');

  const remainingOn = (id: string): number => {
    const allocation = allocations.find(
      (item) => item.cycleId === activeCycle.id && item.bucketId === id && !item.deletedAt
    );
    if (!allocation) return 0;
    return allocation.plannedAmount - allocation.actualAmount;
  };

  const handleSpend = async () => {
    if (amount === null || amount <= 0) {
      addToast('Inserisci un importo maggiore di zero.', 'error');
      return;
    }
    if (description.trim() === '') {
      addToast('Scrivi una descrizione: fra un mese non ricorderai cos’era.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await createItem('transactions', {
        ...newBase(),
        cycleId: activeCycle.id,
        bucketId: selectedId,
        type: 'expense',
        amount,
        date: todayCalendarDate(),
        description: description.trim(),
        category: null,
        shoppingItemId: null,
        taskId: null,
      });

      // The bucket's `actualAmount` is always the sum of its real movements.
      await syncAllocations(activeCycle.id);

      const bucketName = activeBuckets.find((bucket) => bucket.id === selectedId)?.name ?? 'bucket';
      addToast(`${formatCents(amount)} da ${bucketName}.`, 'success');
      setAmount(null);
      setDescription('');
    } catch {
      // The store already reported the failure.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="space-y-3">
      <h2 className="kpi-label">Spesa rapida</h2>

      <div className="flex gap-3">
        <MoneyInput
          label="Importo"
          className="w-36 shrink-0"
          value={amount ?? 0}
          onChange={setAmount}
        />
        <Field
          label="Descrizione"
          className="flex-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="es. Spesa al mercato"
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSpend();
          }}
        />
      </div>

      <Select
        label="Bucket"
        value={selectedId}
        onChange={(e) => setBucketId(e.target.value)}
        options={activeBuckets.map((bucket) => ({
          value: bucket.id,
          label: `${bucket.name} — ${formatCents(remainingOn(bucket.id), { compact: true })}`,
        }))}
      />

      <Button onClick={() => void handleSpend()} disabled={isSaving} fullWidth>
        Registra la spesa
      </Button>
    </Card>
  );
}
