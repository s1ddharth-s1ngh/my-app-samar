import { Link } from 'react-router-dom';
import {
  Boxes,
  CalendarClock,
  ChevronRight,
  Layers,
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
            color: bucket?.color ?? 'var(--ink-faint)',
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

          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Entrate"
              value={<Money cents={totals.income} compact />}
              tone="accent"
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
              tone={totals.spent > totals.allocated ? 'alert' : 'neutral'}
            />
            <KpiCard
              label="Disponibile"
              value={<Money cents={totals.available} compact />}
              tone={totals.available < 0 ? 'alert' : 'success'}
            />
          </div>

          <section className="space-y-2">
            <h2 className="kpi-label">Bucket</h2>
            {rows.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="Nessun bucket allocato"
                description="Registra un’entrata e il motore ripartirà i soldi tra i bucket attivi."
              />
            ) : (
              <ul className="space-y-2">
                {rows.map((row) => (
                  <li key={row.id}>
                    <Card padding="sm" className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.color }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 font-medium text-ink truncate">
                          {row.name}
                        </span>
                        <Money
                          cents={row.available}
                          className={`font-semibold shrink-0 ${
                            row.available < 0 ? 'text-alert' : 'text-ink'
                          }`}
                        />
                      </div>

                      <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.available < 0 ? 'bg-alert' : 'bg-accent'
                          }`}
                          style={{
                            width:
                              row.planned > 0
                                ? `${Math.min(100, (row.spent / row.planned) * 100)}%`
                                : '0%',
                          }}
                        />
                      </div>

                      <p className="text-sm text-ink-faint">
                        <Money cents={row.spent} compact /> spesi su{' '}
                        <Money cents={row.planned} compact /> allocati
                      </p>
                    </Card>
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
        <ul className="space-y-2">
          {SECTIONS.map(({ to, icon: Icon, title, description }) => (
            <li key={to}>
              <Link to={to} className="block rounded-[18px]">
                <Card interactive padding="sm" className="flex items-center gap-3">
                  <span className="icon-tile">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink">{title}</span>
                    <span className="block text-sm text-ink-faint truncate">{description}</span>
                  </span>
                  <ChevronRight size={18} className="text-ink-faint shrink-0" aria-hidden="true" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
