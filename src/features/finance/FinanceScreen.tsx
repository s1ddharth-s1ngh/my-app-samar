import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Wallet } from 'lucide-react';
import { Card, CardHeader, EmptyState, MetricCard, Money, PageHeader, TabPills } from '@/ui';
import { LINK_SOFT, PILL_QUIET, ROW_DIVIDE } from '@/lib/surfaces';
import { formatCents } from '@/domain/money';
import {
  cycleLengthInDays,
  daysElapsed,
  parseCalendarDate,
  todayCalendarDate,
} from '@/domain/cycles';
import { useDataStore } from '@/stores/useDataStore';
import { useCycleTotals } from './useCycleTotals';
import { deltaPct, useCycleSeries } from './useCycleSeries';
import { CycleForecast } from './CycleForecast';
import { CycleBanner } from '../cycles/CycleBanner';

const QUICK_LINKS: [string, string][] = [
  ['Entrate', '/soldi/entrate'],
  ['Movimenti', '/soldi/movimenti'],
  ['Ripartizione', '/soldi/ripartizione'],
  ['Bucket', '/soldi/bucket'],
  ['Storico', '/soldi/storico'],
];

const TABS = [
  { id: 'panoramica', label: 'Panoramica' },
  { id: 'bucket', label: 'Bucket' },
  { id: 'movimenti', label: 'Movimenti' },
] as const;

type Tab = (typeof TABS)[number]['id'];

const DAY_FORMAT = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

function euro(value: unknown): string {
  return typeof value === 'number' ? formatCents(Math.round(value), { compact: true }) : '';
}

/**
 * The money cockpit. Two rich metric cards carry the story, a wide chart carries
 * the trend, and the narrow column carries what needs doing — the shape of the
 * commercial dashboard it is modelled on.
 */
export default function FinanceScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('panoramica');

  const totals = useCycleTotals();
  const series = useCycleSeries();
  const buckets = useDataStore((state) => state.buckets);
  const allocations = useDataStore((state) => state.allocations);
  const transactions = useDataStore((state) => state.transactions);
  const shoppingItems = useDataStore((state) => state.shoppingItems);

  const cycleId = totals.cycle?.id;

  const rows = useMemo(() => {
    if (!cycleId) return [];
    return allocations
      .filter((item) => item.cycleId === cycleId && !item.deletedAt)
      .map((allocation) => {
        const bucket = buckets.find((item) => item.id === allocation.bucketId);
        return {
          id: allocation.id,
          bucketId: allocation.bucketId,
          name: bucket?.name ?? 'Bucket rimosso',
          color: bucket?.color ?? '#9DB560',
          priority: bucket?.priority ?? 99,
          planned: allocation.plannedAmount,
          spent: allocation.actualAmount,
          available: allocation.plannedAmount - allocation.actualAmount,
        };
      })
      .sort((a, b) => a.priority - b.priority);
  }, [allocations, buckets, cycleId]);

  const recent = useMemo(() => {
    if (!cycleId) return [];
    return transactions
      .filter((item) => item.cycleId === cycleId && !item.deletedAt)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6);
  }, [transactions, cycleId]);

  /** Money a planned purchase has already claimed but not yet spent. */
  const committed = useMemo(() => {
    if (!cycleId) return 0;
    return shoppingItems
      .filter((item) => item.status === 'planned' && item.cycleId === cycleId && !item.deletedAt)
      .reduce((acc, item) => acc + item.estimatedCost, 0);
  }, [shoppingItems, cycleId]);

  // The banner carries the only button that opens a cycle, so it belongs here
  // too: being told to go to another screen is not an answer.
  if (!totals.cycle) {
    return (
      <div className="space-y-3">
        <PageHeader title="Soldi" subtitle="Nessun ciclo aperto" />
        <CycleBanner />
        <Card>
          <EmptyState
            icon={Wallet}
            title="Nessun ciclo aperto"
            description="Apri un ciclo qui sopra: entrate, bucket e movimenti nascono da lì."
          />
        </Card>
      </div>
    );
  }

  const bounds = { startDate: totals.cycle.startDate, endDate: totals.cycle.endDate };
  const elapsed = daysElapsed(bounds, todayCalendarDate());
  const length = cycleLengthInDays(bounds);

  const incomeDelta = series.previous ? deltaPct(totals.income, series.previous.income) : null;
  const spentDelta = series.previous ? deltaPct(totals.spent, series.previous.spent) : null;
  const overspent = rows.filter((row) => row.available < 0).length;
  const cycleTransactions = transactions.filter(
    (item) => item.cycleId === cycleId && !item.deletedAt
  ).length;

  return (
    <div className="space-y-3">
      {/* Only shows itself when the cycle no longer covers today. */}
      <CycleBanner />

      {/* ── Header + quick access ── */}
      <div className="mb-1 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Soldi"
          subtitle={
            <>
              Ciclo <span className="font-medium text-white/70">{totals.cycle.label}</span> · giorno{' '}
              {elapsed} di {length}
            </>
          }
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_LINKS.map(([label, href]) => (
            <button key={href} type="button" onClick={() => navigate(href)} className={PILL_QUIET}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TabPills items={TABS} value={tab} onChange={setTab} ariaLabel="Vista" />
        <Link to="/soldi/storico" className={`ml-auto ${LINK_SOFT}`}>
          Storico completo →
        </Link>
      </div>

      {overspent > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-[12px] text-white/70">
          <span className="font-semibold text-white">
            {overspent} {overspent === 1 ? 'bucket è' : 'bucket sono'} oltre il budget
          </span>{' '}
          in questo ciclo. Correggi la ripartizione o rimanda una spesa al ciclo successivo.
        </div>
      )}

      {tab === 'panoramica' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <MetricCard
              label="Entrate del ciclo"
              value={formatCents(totals.income, { compact: true })}
              delta={incomeDelta}
              deltaSuffix=" vs prec."
              chartData={series.points}
              chartKey="income"
              subs={[
                {
                  label: 'Confermate',
                  value: formatCents(totals.incomeReceived, { compact: true }),
                },
                {
                  label: 'Previste',
                  value: formatCents(totals.income - totals.incomeReceived, { compact: true }),
                  tone: totals.income > totals.incomeReceived ? 'warn' : 'default',
                },
                { label: 'Allocato', value: formatCents(totals.allocated, { compact: true }) },
              ]}
            />
            <MetricCard
              label="Disponibile"
              value={formatCents(totals.available, { compact: true })}
              // Spending less than last cycle is the good direction, so the sign flips.
              delta={spentDelta === null ? null : -spentDelta}
              deltaSuffix=" di spesa"
              chartData={series.points}
              chartKey="saved"
              alert={totals.available < 0}
              subs={[
                { label: 'Speso', value: formatCents(totals.spent, { compact: true }) },
                {
                  label: 'Bucket scoperti',
                  value: String(overspent),
                  tone: overspent > 0 ? 'bad' : 'good',
                },
                { label: 'Giorni rimasti', value: String(Math.max(0, length - elapsed)) },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Entrate e spese per ciclo"
                subtitle="confronto sui cicli registrati"
                action={
                  <Link to="/soldi/storico" className={LINK_SOFT}>
                    Dettaglio →
                  </Link>
                }
              />
              {series.points.length < 2 ? (
                <p className="py-6 text-center text-[12px] text-white/35">
                  Serve almeno un secondo ciclo per un confronto.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={series.points}
                    margin={{ top: 4, right: 4, bottom: 0, left: -14 }}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="short"
                      tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={euro}
                      width={62}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      contentStyle={{
                        background: '#111111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={euro}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }} />
                    <Bar dataKey="income" name="Entrate" fill="#9DB560" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name="Spese" fill="#d97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <div className="flex flex-col gap-3">
              <CycleForecast />

              <Card className="flex-1">
                <CardHeader
                  title="Ultimi movimenti"
                  action={
                    <Link to="/soldi/movimenti" className={LINK_SOFT}>
                      Tutti →
                    </Link>
                  }
                />
                {recent.length === 0 ? (
                  <p className="py-4 text-center text-[12px] text-white/35">Nessun movimento.</p>
                ) : (
                  <div className={ROW_DIVIDE}>
                    {recent.map((item) => (
                      <div key={item.id} className="flex min-w-0 items-center gap-3 py-2">
                        <span className="min-w-0 flex-1 truncate text-[12px] text-white/85">
                          {item.description}
                        </span>
                        <span className="hidden shrink-0 text-[11px] text-white/35 tabular-nums sm:inline">
                          {DAY_FORMAT.format(parseCalendarDate(item.date))}
                        </span>
                        <Money
                          cents={item.amount}
                          className="shrink-0 text-[12px] font-semibold"
                          compact
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {tab === 'bucket' && <BucketTable rows={rows} committed={committed} />}

      {tab === 'movimenti' && (
        <Card>
          <CardHeader
            title="Movimenti del ciclo"
            subtitle={`${cycleTransactions} registrati`}
            action={
              <Link to="/soldi/movimenti" className={LINK_SOFT}>
                Apri la lista completa →
              </Link>
            }
          />
          {recent.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-white/35">Nessun movimento.</p>
          ) : (
            <div className={ROW_DIVIDE}>
              {recent.map((item) => (
                <div key={item.id} className="flex min-w-0 items-center gap-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-[12px] text-white/85">
                    {item.description}
                  </span>
                  <span className="shrink-0 text-[11px] text-white/35 tabular-nums">
                    {DAY_FORMAT.format(parseCalendarDate(item.date))}
                  </span>
                  <Money cents={item.amount} className="shrink-0 text-[12px] font-semibold" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

interface BucketRow {
  id: string;
  bucketId: string;
  name: string;
  color: string;
  planned: number;
  spent: number;
  available: number;
}

const TH =
  'px-2 py-1.5 text-[9.5px] uppercase tracking-[0.06em] font-semibold text-white/35 whitespace-nowrap';

/** The split, as a table: one row per bucket, every figure right-aligned. */
function BucketTable({ rows, committed }: { rows: BucketRow[]; committed: number }) {
  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Wallet}
          title="Nessun bucket allocato"
          description="Registra un’entrata: il motore ripartirà i soldi tra i bucket attivi."
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Ripartizione del ciclo"
        subtitle={committed > 0 ? `${formatCents(committed)} impegnati da acquisti` : undefined}
        action={
          <Link to="/soldi/ripartizione" className={LINK_SOFT}>
            Correggi →
          </Link>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr>
              <th className={`${TH} text-left`}>Bucket</th>
              <th className={`${TH} w-[140px] text-left`}>Consumo</th>
              <th className={`${TH} text-right`}>Allocato</th>
              <th className={`${TH} text-right`}>Speso</th>
              <th className={`${TH} text-right`}>Resta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const ratio = row.planned > 0 ? Math.min(1, row.spent / row.planned) : 0;
              return (
                <tr key={row.id} className="border-t border-white/[0.04]">
                  <td className="px-2 py-2">
                    <Link
                      to={`/soldi/bucket/${row.bucketId}`}
                      className="flex min-w-0 items-center gap-2 text-white/85 hover:text-white"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: row.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{row.name}</span>
                    </Link>
                  </td>
                  <td className="px-2 py-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${row.available < 0 ? 'bg-red-400' : 'bg-[#9DB560]'}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right text-white/60 tabular-nums">
                    {formatCents(row.planned, { compact: true })}
                  </td>
                  <td className="px-2 py-2 text-right text-white/60 tabular-nums">
                    {formatCents(row.spent, { compact: true })}
                  </td>
                  <td
                    className={`px-2 py-2 text-right font-semibold tabular-nums ${
                      row.available < 0 ? 'text-red-300' : 'text-white'
                    }`}
                  >
                    {formatCents(row.available, { compact: true })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
