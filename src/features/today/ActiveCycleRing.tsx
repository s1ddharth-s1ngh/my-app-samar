import { useDataStore } from '@/stores/useDataStore';
import { CycleRing } from '@/ui';
import { getTodayDate, parseDate } from '../cycles/engine';

export function ActiveCycleRing() {
  const cycles = useDataStore((state) => state.cycles);
  const allBuckets = useDataStore((state) => state.buckets);
  const allocations = useDataStore((state) => state.allocations);

  const activeCycle = cycles.find((c) => c.status === 'active');
  if (!activeCycle) return null;

  // Calculate days
  const today = parseDate(getTodayDate());
  const start = parseDate(activeCycle.startDate);
  const end = parseDate(activeCycle.endDate);

  const daysTotal = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const daysPassed = Math.max(
    0,
    Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Calculate budget
  // Get allocations for this cycle
  const cycleAllocations = allocations.filter((a) => a.cycleId === activeCycle.id);

  // Combine with buckets to get colors
  let totalBudget = 0;
  const bucketsMap = new Map<string, { id: string; color: string; amount: number; name: string }>();

  // Initialize all active buckets to 0
  allBuckets.forEach((b) => {
    if (b.isActive) {
      bucketsMap.set(b.id, { id: b.id, color: b.color, amount: 0, name: b.name });
    }
  });

  // Add allocation amounts
  cycleAllocations.forEach((a) => {
    const b = bucketsMap.get(a.bucketId);
    if (b) {
      b.amount += a.actualAmount;
      totalBudget += a.actualAmount;
    }
  });

  const buckets = Array.from(bucketsMap.values()).filter((b) => b.amount > 0);

  return (
    <div className="flex flex-col items-center p-6 bg-surface border border-line rounded-2xl shadow-sm">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">{activeCycle.label}</h2>
        <p className="text-sm text-zinc-500">
          Giorno {Math.min(daysPassed, daysTotal)} di {daysTotal}
        </p>
      </div>

      <CycleRing
        daysTotal={daysTotal}
        daysPassed={daysPassed}
        totalBudget={totalBudget}
        buckets={buckets}
      />

      {totalBudget > 0 && (
        <div className="mt-6 w-full max-w-xs space-y-2">
          {buckets.map((b) => (
            <div key={b.id} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                <span>{b.name}</span>
              </div>
              <span className="font-medium tabular-nums">
                {(b.amount / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
