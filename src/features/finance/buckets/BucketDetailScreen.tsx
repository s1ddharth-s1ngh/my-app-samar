import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Boxes, Receipt, ShoppingBag, Target } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { Card, EmptyState, StatCard, Money, PageHeader } from '@/ui';
import { parseCalendarDate } from '@/domain/cycles';

const DAY_FORMAT = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

/** How many past cycles the trend looks back over. */
const TREND_LENGTH = 6;

export function BucketDetailScreen() {
  const { bucketId } = useParams<{ bucketId: string }>();
  const buckets = useDataStore((state) => state.buckets);
  const cycles = useDataStore((state) => state.cycles);
  const allocations = useDataStore((state) => state.allocations);
  const transactions = useDataStore((state) => state.transactions);
  const shoppingItems = useDataStore((state) => state.shoppingItems);

  const bucket = buckets.find((item) => item.id === bucketId && !item.deletedAt);
  const activeCycle = cycles.find((item) => item.status === 'active' && !item.deletedAt);

  const trend = useMemo(() => {
    if (!bucket) return [];
    return cycles
      .filter((cycle) => !cycle.deletedAt)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .slice(0, TREND_LENGTH)
      .reverse()
      .map((cycle) => {
        const allocation = allocations.find(
          (item) => item.cycleId === cycle.id && item.bucketId === bucket.id && !item.deletedAt
        );
        const spent = transactions
          .filter(
            (item) =>
              item.cycleId === cycle.id &&
              item.bucketId === bucket.id &&
              item.type === 'expense' &&
              !item.deletedAt
          )
          .reduce((acc, item) => acc + item.amount, 0);
        return { cycle, planned: allocation?.plannedAmount ?? 0, spent };
      });
  }, [bucket, cycles, allocations, transactions]);

  if (!bucket) {
    return (
      <div className="space-y-6">
        <PageHeader title="Bucket" breadcrumb={{ to: '/soldi', label: 'Soldi' }} />
        <EmptyState
          icon={Boxes}
          title="Bucket non trovato"
          description="Potrebbe essere stato eliminato. Torna ai Soldi e scegline un altro."
        />
      </div>
    );
  }

  const allocation = activeCycle
    ? allocations.find(
        (item) => item.cycleId === activeCycle.id && item.bucketId === bucket.id && !item.deletedAt
      )
    : undefined;

  const planned = allocation?.plannedAmount ?? 0;
  const spent = allocation?.actualAmount ?? 0;

  // Planned purchases hold money that is not spent yet but is already promised.
  const committed = activeCycle
    ? shoppingItems
        .filter(
          (item) =>
            item.status === 'planned' &&
            item.bucketId === bucket.id &&
            item.cycleId === activeCycle.id &&
            !item.deletedAt
        )
        .reduce((acc, item) => acc + item.estimatedCost, 0)
    : 0;

  const available = planned - spent - committed;

  const cycleTransactions = activeCycle
    ? transactions
        .filter(
          (item) =>
            item.cycleId === activeCycle.id && item.bucketId === bucket.id && !item.deletedAt
        )
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const plannedPurchases = activeCycle
    ? shoppingItems.filter(
        (item) =>
          item.status === 'planned' &&
          item.bucketId === bucket.id &&
          item.cycleId === activeCycle.id &&
          !item.deletedAt
      )
    : [];

  // Progress toward a savings goal is measured on what the bucket holds, not what it spends.
  const towardsTarget = bucket.targetAmount ? Math.max(0, planned - spent) : null;
  const maxTrend = Math.max(1, ...trend.map((row) => Math.max(row.planned, row.spent)));

  return (
    <div className="space-y-6">
      <PageHeader
        title={bucket.name}
        subtitle={activeCycle ? activeCycle.label : 'Nessun ciclo aperto'}
        breadcrumb={{ to: '/soldi', label: 'Soldi' }}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Allocato" value={<Money cents={planned} compact />} />
        <StatCard
          label="Speso"
          value={<Money cents={spent} compact />}
          progress={planned > 0 ? spent / planned : undefined}
        />
        <StatCard
          label="Impegnato"
          value={<Money cents={committed} compact />}
          tone={committed > 0 ? 'warn' : 'neutral'}
          hint="Acquisti pianificati"
        />
        <StatCard
          label="Disponibile"
          value={<Money cents={available} compact />}
          tone={available < 0 ? 'bad' : 'good'}
        />
      </div>

      {bucket.targetAmount !== null && towardsTarget !== null && (
        <Card className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/45">
              <Target size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="kpi-label">Obiettivo</p>
              <p className="text-sm text-white/45">
                <Money cents={towardsTarget} /> su <Money cents={bucket.targetAmount} />
              </p>
            </div>
            <span className="kpi-number">
              {Math.min(100, Math.round((towardsTarget / bucket.targetAmount) * 100))}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{
                width: `${Math.min(100, (towardsTarget / bucket.targetAmount) * 100)}%`,
              }}
            />
          </div>
        </Card>
      )}

      {plannedPurchases.length > 0 && (
        <section className="space-y-2">
          <h2 className="kpi-label">Acquisti pianificati</h2>
          <ul className="space-y-2">
            {plannedPurchases.map((item) => (
              <li key={item.id}>
                <Card className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/45">
                    <ShoppingBag size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 font-medium text-white truncate">
                    {item.name}
                  </span>
                  <Money cents={item.estimatedCost} className="font-semibold shrink-0" />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="kpi-label">Movimenti del ciclo</h2>
        {cycleTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nessun movimento"
            description="Su questo bucket non è ancora uscito niente in questo ciclo."
          />
        ) : (
          <ul className="space-y-2">
            {cycleTransactions.map((item) => (
              <li key={item.id}>
                <Card className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{item.description}</p>
                    <p className="text-sm text-white/45">
                      {DAY_FORMAT.format(parseCalendarDate(item.date))}
                    </p>
                  </div>
                  <Money cents={item.amount} className="font-semibold shrink-0" />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {trend.length > 1 && (
        <section className="space-y-2">
          <h2 className="kpi-label">Ultimi {trend.length} cicli</h2>
          <Card>
            <ul className="space-y-3">
              {trend.map((row) => (
                <li key={row.cycle.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-white/45">{row.cycle.label}</span>
                    <span className="shrink-0 tabular-nums text-white/45">
                      <Money cents={row.spent} compact /> / <Money cents={row.planned} compact />
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    <div
                      className="rounded-full bg-[#9DB560]/50"
                      style={{ width: `${(row.planned / maxTrend) * 100}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className="rounded-full bg-[#9DB560]"
                      style={{ width: `${(row.spent / maxTrend) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
