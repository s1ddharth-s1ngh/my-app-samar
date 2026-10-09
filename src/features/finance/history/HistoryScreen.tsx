import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import { useDataStore } from '@/stores/useDataStore';
import { ChartFrame, EmptyState, PageHeader } from '@/ui';
import { CHART_GRID, CHART_INK, categoricalColor } from '@/ui/chartPalette';
import { formatCents } from '@/domain/money';

/** Buckets beyond this fold into a single "Altro" slice rather than inventing hues. */
const MAX_SLICES = 6;

const AXIS_STYLE = { fill: 'var(--theme-muted)', fontSize: 11 } as const;

function euro(value: number): string {
  return formatCents(Math.round(value), { compact: true });
}

/** Recharts hands formatters an untyped value; everything we plot is cents. */
function euroTick(value: unknown): string {
  return typeof value === 'number' ? euro(value) : '';
}

export function HistoryScreen() {
  const cycles = useDataStore((state) => state.cycles);
  const incomeEntries = useDataStore((state) => state.incomeEntries);
  const transactions = useDataStore((state) => state.transactions);
  const allocations = useDataStore((state) => state.allocations);
  const buckets = useDataStore((state) => state.buckets);

  const perCycle = useMemo(
    () =>
      cycles
        .filter((cycle) => !cycle.deletedAt)
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map((cycle) => {
          const income = incomeEntries
            .filter((entry) => entry.cycleId === cycle.id && !entry.deletedAt)
            .reduce((acc, entry) => acc + entry.amount, 0);
          const spent = transactions
            .filter(
              (item) => item.cycleId === cycle.id && item.type === 'expense' && !item.deletedAt
            )
            .reduce((acc, item) => acc + item.amount, 0);
          return { id: cycle.id, label: cycle.label, income, spent, saved: income - spent };
        }),
    [cycles, incomeEntries, transactions]
  );

  // The cumulative line is the story the per-cycle bars cannot tell.
  const cumulative = useMemo(
    () =>
      perCycle.reduce<{ label: string; total: number }[]>((acc, row) => {
        const previous = acc[acc.length - 1]?.total ?? 0;
        acc.push({ label: row.label, total: previous + row.saved });
        return acc;
      }, []),
    [perCycle]
  );

  const averageSplit = useMemo(() => {
    const totals = new Map<string, number>();
    for (const allocation of allocations) {
      if (allocation.deletedAt) continue;
      totals.set(
        allocation.bucketId,
        (totals.get(allocation.bucketId) ?? 0) + allocation.plannedAmount
      );
    }

    const cycleCount = Math.max(1, perCycle.length);
    const rows = [...totals.entries()]
      .map(([bucketId, total]) => ({
        name: buckets.find((item) => item.id === bucketId)?.name ?? 'Bucket rimosso',
        value: Math.round(total / cycleCount),
      }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value);

    if (rows.length <= MAX_SLICES) return rows;

    const head = rows.slice(0, MAX_SLICES - 1);
    const tail = rows.slice(MAX_SLICES - 1).reduce((acc, row) => acc + row.value, 0);
    return [...head, { name: 'Altro', value: tail }];
  }, [allocations, buckets, perCycle.length]);

  if (perCycle.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Storico" breadcrumb={{ to: '/soldi', label: 'Soldi' }} />
        <EmptyState
          icon={LineChartIcon}
          title="Nessun ciclo da confrontare"
          description="Serve almeno un ciclo con entrate e spese perché lo storico dica qualcosa."
        />
      </div>
    );
  }

  const lastCycle = perCycle[perCycle.length - 1];
  const totalSaved = cumulative[cumulative.length - 1]?.total ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Storico"
        subtitle={`${perCycle.length} ${perCycle.length === 1 ? 'ciclo' : 'cicli'}`}
        breadcrumb={{ to: '/soldi', label: 'Soldi' }}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartFrame
          title="Entrate e spese per ciclo"
          caption="Due barre affiancate per ogni ciclo."
          summary={
            lastCycle
              ? `Nell'ultimo ciclo, ${lastCycle.label}, sono entrati ${euro(lastCycle.income)} e ne sono usciti ${euro(lastCycle.spent)}.`
              : 'Nessun dato.'
          }
          table={{
            columns: ['Ciclo', 'Entrate', 'Spese', 'Risparmio'],
            rows: perCycle.map((row) => [
              row.label,
              euro(row.income),
              euro(row.spent),
              euro(row.saved),
            ]),
          }}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={perCycle} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={CHART_GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
              <YAxis
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={false}
                tickFormatter={euroTick}
                width={64}
              />
              <Tooltip
                cursor={{ fill: 'var(--theme-card-raised)' }}
                contentStyle={{
                  background: 'var(--theme-card)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: 12,
                  color: 'var(--theme-foreground)',
                }}
                formatter={euroTick}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: CHART_INK }} />
              <Bar
                dataKey="income"
                name="Entrate"
                fill={categoricalColor(0)}
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="spent" name="Spese" fill={categoricalColor(1)} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="Ripartizione media"
          caption="Quanto è andato in media a ogni bucket, per ciclo."
          summary={
            averageSplit[0]
              ? `Il bucket più servito è ${averageSplit[0].name}, con ${euro(averageSplit[0].value)} per ciclo.`
              : 'Nessuna allocazione registrata.'
          }
          table={{
            columns: ['Bucket', 'Media per ciclo'],
            rows: averageSplit.map((row) => [row.name, euro(row.value)]),
          }}
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={averageSplit}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
                stroke="var(--theme-card)"
                strokeWidth={2}
              >
                {averageSplit.map((row, index) => (
                  <Cell key={row.name} fill={categoricalColor(index)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--theme-card)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: 12,
                  color: 'var(--theme-foreground)',
                }}
                formatter={euroTick}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: CHART_INK }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>

      <ChartFrame
        title="Risparmio cumulato"
        caption="Quanto hai messo da parte, ciclo dopo ciclo."
        summary={`In totale hai accumulato ${euro(totalSaved)} su ${perCycle.length} cicli.`}
        table={{
          columns: ['Ciclo', 'Cumulato'],
          rows: cumulative.map((row) => [row.label, euro(row.total)]),
        }}
      >
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={cumulative} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              tickFormatter={euroTick}
              width={64}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--theme-card)',
                border: '1px solid var(--theme-border)',
                borderRadius: 12,
                color: 'var(--theme-foreground)',
              }}
              formatter={euroTick}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Cumulato"
              stroke={categoricalColor(2)}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 0, fill: categoricalColor(2) }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}
