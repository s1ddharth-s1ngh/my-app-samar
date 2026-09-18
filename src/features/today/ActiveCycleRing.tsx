import { useDataStore } from '@/stores/useDataStore';
import { Card, CycleRing, Money } from '@/ui';
import { cycleLengthInDays, daysElapsed, todayCalendarDate } from '@/domain/cycles';

interface RingBucket {
  id: string;
  color: string;
  amount: number;
  name: string;
}

export function ActiveCycleRing() {
  const cycles = useDataStore((state) => state.cycles);
  const allBuckets = useDataStore((state) => state.buckets);
  const allocations = useDataStore((state) => state.allocations);

  const activeCycle = cycles.find((item) => item.status === 'active' && !item.deletedAt);
  if (!activeCycle) return null;

  const bounds = { startDate: activeCycle.startDate, endDate: activeCycle.endDate };
  const daysTotal = cycleLengthInDays(bounds);
  const daysPassed = daysElapsed(bounds, todayCalendarDate());

  const cycleAllocations = allocations.filter(
    (item) => item.cycleId === activeCycle.id && !item.deletedAt
  );

  const buckets: RingBucket[] = [];
  let totalBudget = 0;

  for (const bucket of allBuckets) {
    if (!bucket.isActive || bucket.deletedAt) continue;
    const amount = cycleAllocations
      .filter((item) => item.bucketId === bucket.id)
      .reduce((acc, item) => acc + item.actualAmount, 0);
    if (amount <= 0) continue;
    buckets.push({ id: bucket.id, color: bucket.color, amount, name: bucket.name });
    totalBudget += amount;
  }

  return (
    <Card className="flex flex-col items-center" padding="lg">
      <div className="text-center">
        <p className="kpi-label">Ciclo in corso</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">{activeCycle.label}</h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          Giorno {daysPassed} di {daysTotal}
        </p>
      </div>

      <div className="my-6">
        <CycleRing
          daysTotal={daysTotal}
          daysPassed={daysPassed}
          totalBudget={totalBudget}
          buckets={buckets}
        />
      </div>

      {buckets.length > 0 && (
        <ul className="w-full max-w-xs space-y-2">
          {buckets.map((bucket) => (
            <li key={bucket.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: bucket.color }}
                  aria-hidden="true"
                />
                <span className="truncate text-muted-foreground">{bucket.name}</span>
              </span>
              <Money cents={bucket.amount} className="font-medium text-foreground" />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
