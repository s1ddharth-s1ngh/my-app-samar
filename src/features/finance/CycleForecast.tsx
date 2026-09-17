import { TrendingUp } from 'lucide-react';
import { Card, Money } from '@/ui';
import { useCycleTotals } from './useCycleTotals';

/**
 * What the cycle will look like if the income still marked `expected` actually
 * lands. Confirmed numbers are solid; the projected part is dashed and stated
 * as such, so the two are never mistaken for each other.
 */
export function CycleForecast() {
  const totals = useCycleTotals();

  const pending = totals.income - totals.incomeReceived;
  if (!totals.cycle || pending === 0) return null;

  const confirmedAvailable = totals.incomeReceived - totals.spent;
  const projectedAvailable = totals.income - totals.spent;

  return (
    <Card padding="sm" className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="icon-tile">
          <TrendingUp size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="kpi-label">Previsione di fine ciclo</h2>
          <p className="text-sm text-ink-muted">
            <Money cents={pending} /> di entrate previste non sono ancora arrivate.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-[12px] border border-line bg-surface-2 p-3">
          <dt className="kpi-label">Confermato</dt>
          <dd className="kpi-number mt-1">
            <Money cents={confirmedAvailable} compact />
          </dd>
          <p className="mt-1 text-sm text-ink-faint">Solo entrate ricevute</p>
        </div>

        <div className="rounded-[12px] border border-dashed border-signal/50 bg-signal/5 p-3">
          <dt className="kpi-label">Se arriva tutto</dt>
          <dd className="kpi-number mt-1 text-signal">
            <Money cents={projectedAvailable} compact />
          </dd>
          <p className="mt-1 text-sm text-ink-faint">Incluse le previste</p>
        </div>
      </dl>
    </Card>
  );
}
