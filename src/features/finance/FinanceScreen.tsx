import { Link } from 'react-router-dom';
import {
  Boxes,
  CalendarClock,
  ChevronRight,
  Layers,
  LineChart,
  Receipt,
  SlidersHorizontal,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, EmptyState, KpiCard, Money, PageHeader } from '@/ui';
import { useDataStore } from '@/stores/useDataStore';
import { useCycleTotals } from './useCycleTotals';
import { ActiveCycleRing } from '../today/ActiveCycleRing';
import { CycleForecast } from './CycleForecast';

interface SectionLink {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const SECTIONS: SectionLink[] = [
  {
    to: '/soldi/entrate',
    icon: TrendingUp,
    title: 'Entrate del ciclo',
    description: 'Cosa è arrivato e cosa aspetti',
  },
  {
    to: '/soldi/movimenti',
    icon: Receipt,
    title: 'Movimenti',
    description: 'Ogni spesa del ciclo, filtrabile',
  },
  {
    to: '/soldi/ripartizione',
    icon: Layers,
    title: 'Ripartizione del ciclo',
    description: 'Correggi a mano quello che serve',
  },
  {
    to: '/soldi/storico',
    icon: LineChart,
    title: 'Storico',
    description: 'Come vanno i cicli, a confronto',
  },
  {
    to: '/soldi/fonti',
    icon: Wallet,
    title: 'Fonti di entrata',
    description: 'Stipendio, freelance, rendite',
  },
  {
    to: '/soldi/bucket',
    icon: Boxes,
    title: 'Bucket',
    description: 'Dove finiscono i soldi ogni ciclo',
  },
  {
    to: '/soldi/allocazioni',
    icon: SlidersHorizontal,
    title: 'Regole di allocazione',
    description: 'Come si divide quello che entra',
  },
  {
    to: '/soldi/ricorrenti',
    icon: CalendarClock,
    title: 'Spese ricorrenti',
    description: 'Affitto, bollette, abbonamenti',
  },
];

export default function FinanceScreen() {
  const totals = useCycleTotals();
  const buckets = useDataStore((state) => state.buckets);
  const allocations = useDataStore((state) => state.allocations);

  const cycleId = totals.cycle?.id;

  const rows = cycleId
    ? allocations
        .filter((item) => item.cycleId === cycleId && !item.deletedAt)
        .map((allocation) => {
          const bucket = buckets.find((item) => item.id === allocation.bucketId);
          return {
            id: allocation.id,
            bucketId: allocation.bucketId,
            name: bucket?.name ?? 'Bucket rimosso',
            color: bucket?.color ?? 'hsl(var(--muted-foreground))',
            priority: bucket?.priority ?? 99,
            planned: allocation.plannedAmount,
            spent: allocation.actualAmount,
            available: allocation.plannedAmount - allocation.actualAmount,
          };
        })
        .sort((a, b) => a.priority - b.priority)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soldi"
        subtitle={totals.cycle ? totals.cycle.label : 'Nessun ciclo aperto'}
      />

      {totals.cycle ? (
        <>
          <ActiveCycleRing />

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiCard
              label="Entrate"
              value={<Money cents={totals.income} compact />}
              tone="primary"
              hint={
                totals.income === totals.incomeReceived
                  ? 'Tutte confermate'
                  : 'Incluse quelle previste'
              }
            />
            <KpiCard label="Allocato" value={<Money cents={totals.allocated} compact />} />
            <KpiCard
              label="Speso"
              value={<Money cents={totals.spent} compact />}
              progress={totals.allocated > 0 ? totals.spent / totals.allocated : undefined}
              tone={totals.spent > totals.allocated ? 'destructive' : 'neutral'}
            />
            <KpiCard
              label="Disponibile"
              value={<Money cents={totals.available} compact />}
              tone={totals.available < 0 ? 'destructive' : 'success'}
            />
          </div>

          <CycleForecast />

          <section className="space-y-2">
            <h2 className="kpi-label">Bucket</h2>
            {rows.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="Nessun bucket allocato"
                description="Registra un’entrata e il motore ripartirà i soldi tra i bucket attivi."
              />
            ) : (
              <ul className="grid gap-2 md:grid-cols-2">
                {rows.map((row) => (
                  <li key={row.id}>
                    <Link to={`/soldi/bucket/${row.bucketId}`} className="block rounded-xl">
                      <Card interactive padding="sm" className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: row.color }}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1 font-medium text-foreground truncate">
                            {row.name}
                          </span>
                          <Money
                            cents={row.available}
                            className={`font-semibold shrink-0 ${
                              row.available < 0 ? 'text-destructive' : 'text-foreground'
                            }`}
                          />
                        </div>

                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.available < 0 ? 'bg-destructive' : 'bg-primary'
                            }`}
                            style={{
                              width:
                                row.planned > 0
                                  ? `${Math.min(100, (row.spent / row.planned) * 100)}%`
                                  : '0%',
                            }}
                          />
                        </div>

                        <p className="text-sm text-muted-foreground">
                          <Money cents={row.spent} compact /> spesi su{' '}
                          <Money cents={row.planned} compact /> allocati
                        </p>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <EmptyState
          icon={Wallet}
          title="Nessun ciclo aperto"
          description="Apri il primo ciclo dalla schermata Oggi: da lì entrate, bucket e movimenti prendono senso."
        />
      )}

      <nav aria-label="Gestione denaro" className="space-y-2">
        <h2 className="kpi-label">Gestisci</h2>
        <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map(({ to, icon: Icon, title, description }) => (
            <li key={to}>
              <Link to={to} className="block rounded-xl">
                <Card interactive padding="sm" className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{title}</span>
                    <span className="block text-sm text-muted-foreground truncate">
                      {description}
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
