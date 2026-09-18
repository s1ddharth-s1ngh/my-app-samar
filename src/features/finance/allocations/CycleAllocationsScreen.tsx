import { useState } from 'react';
import { Layers, Lock, Unlock, RefreshCw } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  IconButton,
  KpiCard,
  Money,
  MoneyInput,
  PageHeader,
  Sheet,
} from '@/ui';
import type { Allocation } from '@/data/types';
import { nowInstant } from '@/lib/record';
import { syncAllocations } from '@/stores/cycleOperations';

/**
 * The cycle's split, bucket by bucket. Editing a planned amount locks it: from
 * then on the engine leaves that bucket alone until the user unlocks it.
 */
export function CycleAllocationsScreen() {
  const cycles = useDataStore((state) => state.cycles);
  const buckets = useDataStore((state) => state.buckets);
  const allocations = useDataStore((state) => state.allocations);
  const updateItem = useDataStore((state) => state.updateItem);
  const addToast = useToastStore((state) => state.addToast);

  const [editing, setEditing] = useState<Allocation | null>(null);
  const [draftAmount, setDraftAmount] = useState(0);

  const activeCycle = cycles.find((item) => item.status === 'active' && !item.deletedAt);

  if (!activeCycle) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ripartizione" backTo="/soldi" backLabel="Soldi" />
        <EmptyState
          icon={Layers}
          title="Nessun ciclo aperto"
          description="Apri un ciclo dalla schermata Oggi per vederne la ripartizione."
        />
      </div>
    );
  }

  const rows = allocations
    .filter((item) => item.cycleId === activeCycle.id && !item.deletedAt)
    .map((allocation) => ({
      allocation,
      bucket: buckets.find((item) => item.id === allocation.bucketId),
    }))
    .sort((a, b) => (a.bucket?.priority ?? 99) - (b.bucket?.priority ?? 99));

  const totalPlanned = rows.reduce((acc, row) => acc + row.allocation.plannedAmount, 0);
  const lockedCount = rows.filter((row) => row.allocation.isLocked).length;

  const openEdit = (allocation: Allocation) => {
    setDraftAmount(allocation.plannedAmount);
    setEditing(allocation);
  };

  const handleSaveOverride = async () => {
    if (!editing) return;
    try {
      await updateItem('allocations', editing.id, {
        plannedAmount: draftAmount,
        isLocked: true,
        updatedAt: nowInstant(),
      });
      setEditing(null);
      addToast('Allocazione bloccata: il motore non la ricalcola più.', 'success');
    } catch {
      // The store already reported the failure.
    }
  };

  const handleUnlock = async (allocation: Allocation) => {
    try {
      await updateItem('allocations', allocation.id, {
        isLocked: false,
        updatedAt: nowInstant(),
      });
      await syncAllocations(activeCycle.id);
      addToast('Allocazione sbloccata e ricalcolata.', 'info');
    } catch {
      // The store already reported the failure.
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ripartizione"
        subtitle={activeCycle.label}
        backTo="/soldi"
        backLabel="Soldi"
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void syncAllocations(activeCycle.id)}
          >
            <RefreshCw size={16} aria-hidden="true" /> Ricalcola
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Allocato" value={<Money cents={totalPlanned} compact />} tone="primary" />
        <KpiCard
          label="Bloccate"
          value={`${lockedCount} su ${rows.length}`}
          tone={lockedCount > 0 ? 'warning' : 'neutral'}
          hint={lockedCount > 0 ? 'Il motore le lascia stare' : 'Tutte automatiche'}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nessuna allocazione"
          description="Registra un’entrata: il motore ripartirà i soldi tra i bucket attivi."
        />
      ) : (
        <ul className="space-y-2">
          {rows.map(({ allocation, bucket }) => {
            const available = allocation.plannedAmount - allocation.actualAmount;
            return (
              <li key={allocation.id}>
                <Card padding="sm" className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: bucket?.color ?? 'hsl(var(--muted-foreground))' }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {bucket?.name ?? 'Bucket rimosso'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Speso <Money cents={allocation.actualAmount} compact /> · resta{' '}
                        <Money cents={available} compact />
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {allocation.isLocked && (
                        <Chip variant="warning">
                          <Lock size={10} aria-hidden="true" />
                          Bloccata
                        </Chip>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(allocation)}
                        className="text-right"
                        title="Correggi a mano"
                      >
                        <Money cents={allocation.plannedAmount} className="font-semibold" />
                      </button>
                      {allocation.isLocked && (
                        <IconButton
                          icon={Unlock}
                          label={`Sblocca ${bucket?.name ?? 'il bucket'}`}
                          size="sm"
                          onClick={() => void handleUnlock(allocation)}
                        />
                      )}
                    </div>
                  </div>

                  {allocation.plannedAmount > 0 && (
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          available < 0 ? 'bg-destructive' : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min(100, (allocation.actualAmount / allocation.plannedAmount) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title="Correggi l’allocazione"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Se cambi questo importo a mano, il motore smette di ricalcolarlo: resterà così anche
            quando registri nuove entrate. Potrai sbloccarlo quando vuoi.
          </p>
          <MoneyInput
            label="Importo pianificato"
            value={draftAmount}
            onChange={(value) => setDraftAmount(value ?? 0)}
          />
          <div className="pt-2 flex gap-3">
            <Button className="flex-1" onClick={() => void handleSaveOverride()}>
              Blocca a questo importo
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Annulla
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
