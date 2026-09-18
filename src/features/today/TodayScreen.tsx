import { ArrowDownRight, Layers, PiggyBank, Wallet } from 'lucide-react';
import { KpiCard, Money, PageHeader } from '@/ui';
import { CycleBanner } from '../cycles/CycleBanner';
import { QuickSpendForm } from './QuickSpendForm';
import { useCycleTotals } from '../finance/useCycleTotals';
import { daysElapsed, cycleLengthInDays, todayCalendarDate } from '@/domain/cycles';

const GREETING_FORMAT = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export default function TodayScreen() {
  const totals = useCycleTotals();
  const today = new Date();

  const elapsed = totals.cycle
    ? daysElapsed(
        { startDate: totals.cycle.startDate, endDate: totals.cycle.endDate },
        todayCalendarDate(today)
      )
    : 0;
  const length = totals.cycle
    ? cycleLengthInDays({ startDate: totals.cycle.startDate, endDate: totals.cycle.endDate })
    : 0;

  const subtitle = GREETING_FORMAT.format(today);

  return (
    <div className="space-y-6">
      <PageHeader title="Oggi" subtitle={subtitle.charAt(0).toUpperCase() + subtitle.slice(1)} />

      <CycleBanner />

      {totals.cycle && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            label="Disponibile"
            value={<Money cents={totals.available} compact />}
            icon={Wallet}
            tone={totals.available < 0 ? 'destructive' : 'primary'}
            hint={totals.available < 0 ? 'Sei oltre il budget' : 'Su tutti i bucket'}
          />
          <KpiCard
            label="Entrate"
            value={<Money cents={totals.income} compact />}
            icon={PiggyBank}
            hint={
              totals.income === totals.incomeReceived
                ? 'Tutte confermate'
                : 'Incluse quelle previste'
            }
          />
          <KpiCard
            label="Allocato"
            value={<Money cents={totals.allocated} compact />}
            icon={Layers}
          />
          <KpiCard
            label="Speso"
            value={<Money cents={totals.spent} compact />}
            icon={ArrowDownRight}
            progress={totals.allocated > 0 ? totals.spent / totals.allocated : undefined}
            tone={totals.spent > totals.allocated ? 'destructive' : 'neutral'}
            hint={length > 0 ? `Giorno ${elapsed} di ${length}` : undefined}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <QuickSpendForm />
      </div>
    </div>
  );
}
