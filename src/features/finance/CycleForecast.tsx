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
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-foreground">Previsione di fine ciclo</h2>
          <p className="text-[11px] text-muted-foreground">
            <Money cents={pending} /> di entrate previste non sono ancora arrivate.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-foreground/[0.04] p-3">
          <dt className="kpi-label">Confermato</dt>
          <dd className="kpi-number mt-1">
            <Money cents={confirmedAvailable} compact />
          </dd>
          <p className="mt-1 text-[10.5px] text-muted-foreground">Solo entrate ricevute</p>
        </div>

        <div className="rounded-xl border border-dashed border-warn/50 bg-warn/5 p-3">
          <dt className="kpi-label">Se arriva tutto</dt>
          <dd className="kpi-number mt-1 text-warn">
            <Money cents={projectedAvailable} compact />
          </dd>
          <p className="mt-1 text-[10.5px] text-muted-foreground">Incluse le previste</p>
        </div>
      </dl>
    </Card>
  );
}
