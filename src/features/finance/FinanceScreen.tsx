import { Link } from 'react-router-dom';
import { ChevronRight, CalendarClock, Layers, SlidersHorizontal, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, KpiCard, Money, PageHeader } from '@/ui';
import { useCycleTotals } from './useCycleTotals';

interface SectionLink {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const SECTIONS: SectionLink[] = [
  {
    to: '/soldi/fonti',
    icon: Wallet,
    title: 'Fonti di entrata',
    description: 'Stipendio, freelance, rendite',
  },
  {
    to: '/soldi/bucket',
    icon: Layers,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soldi"
        subtitle={totals.cycle ? totals.cycle.label : 'Nessun ciclo aperto'}
      />

      {totals.cycle && (
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="Entrate del ciclo"
            value={<Money cents={totals.income} compact />}
            tone="accent"
          />
          <KpiCard
            label="Disponibile"
            value={<Money cents={totals.available} compact />}
            tone={totals.available < 0 ? 'alert' : 'success'}
            progress={totals.allocated > 0 ? totals.spent / totals.allocated : undefined}
          />
        </div>
      )}

      <nav aria-label="Sezioni denaro">
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
