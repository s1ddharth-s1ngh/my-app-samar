import { useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button, Card, Field, MoneyInput } from '@/ui';
import { todayCalendarDate } from '@/domain/cycles';

export function QuickSpendForm() {
  const cycles = useDataStore((state) => state.cycles);
  const buckets = useDataStore((state) => state.buckets).sort((a, b) => a.priority - b.priority);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const addToast = useToastStore((state) => state.addToast);
  const allocations = useDataStore((state) => state.allocations);

  const [amount, setAmount] = useState<number | null>(null);
  const [description, setDescription] = useState('');

  const activeCycle = cycles.find((c) => c.status === 'active');

  const handleSpend = async () => {
    if (!activeCycle || !amount || amount <= 0 || !description.trim()) {
      addToast('Inserisci importo e descrizione.', 'error');
      return;
    }

    // Logic: find a bucket with enough funds, in priority order
    // In Ciclo, you usually select a bucket, or it takes from the "remainder" / lowest priority or first available?
    // "scala i soldi dal primo bucket disponibile in ordine"

    const cycleAllocations = allocations.filter((a) => a.cycleId === activeCycle.id);
    let chosenBucketId: string | null = null;
    let chosenAllocationId: string | null = null;
    let availableAmount = 0;

    for (const bucket of buckets) {
      if (!bucket.isActive) continue;
      const alloc = cycleAllocations.find((a) => a.bucketId === bucket.id);
      if (alloc && alloc.actualAmount >= amount) {
        chosenBucketId = bucket.id;
        chosenAllocationId = alloc.id;
        availableAmount = alloc.actualAmount;
        break; // found the first bucket that can cover it
      }
    }

    if (!chosenBucketId) {
      addToast('Nessun bucket ha fondi sufficienti!', 'error');
      return;
    }

    try {
      // 1. Create Transaction
      await createItem('transactions', {
        id: crypto.randomUUID(),
        cycleId: activeCycle.id,
        bucketId: chosenBucketId,
        type: 'expense',
        amount: amount,
        date: todayCalendarDate(),
        description: description.trim(),
        category: null,
        shoppingItemId: null,
        taskId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      // 2. Reduce the allocation
      await updateItem('allocations', chosenAllocationId!, {
        actualAmount: availableAmount - amount,
      });

      addToast(
        `Spesi ${(amount / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })} da ${buckets.find((b) => b.id === chosenBucketId)?.name}`,
        'success'
      );
      setAmount(null);
      setDescription('');
    } catch {
      addToast('Errore durante la registrazione della spesa.', 'error');
    }
  };

  if (!activeCycle) return null;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">Spesa rapida</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <MoneyInput label="Importo" value={amount ?? 0} onChange={(val) => setAmount(val)} />
        </div>
        <div className="flex-[2]">
          <Field
            label="Descrizione"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="es. Pizza margherita"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSpend();
            }}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={handleSpend} className="w-full sm:w-auto h-12">
            Spendi
          </Button>
        </div>
      </div>
    </Card>
  );
}
