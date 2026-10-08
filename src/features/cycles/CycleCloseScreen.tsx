import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarCheck } from 'lucide-react';
import { Button, Card, Divider, EmptyState, StatCard, Money, PageHeader } from '@/ui';
import { useDataStore } from '@/stores/useDataStore';
import { buildCloseSummary, closeCycleAndOpenNext } from '@/stores/cycleOperations';

/**
 * Nothing is closed without the user seeing the numbers first: what each bucket
 * had, what it spent, and what the next cycle will open with.
 */
export function CycleCloseScreen() {
  const cycles = useDataStore((state) => state.cycles);
  const allocations = useDataStore((state) => state.allocations);
  const transactions = useDataStore((state) => state.transactions);
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  const activeCycle = cycles.find((item) => item.status === 'active' && !item.deletedAt);

  // Recomputed whenever the underlying data changes, so the preview is live.
  const summary = useMemo(
    () => (activeCycle ? buildCloseSummary(activeCycle.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCycle?.id, allocations, transactions, cycles]
  );

  if (!activeCycle || !summary) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chiudi il ciclo" breadcrumb={{ to: '/soldi', label: 'Soldi' }} />
        <EmptyState
          icon={CalendarCheck}
          title="Nessun ciclo aperto"
          description="Apri un ciclo dalla schermata Agenda per poterlo poi chiudere."
        />
      </div>
    );
  }

  const handleClose = async () => {
    setIsClosing(true);
    try {
      await closeCycleAndOpenNext(activeCycle.id);
      navigate('/soldi');
    } finally {
      setIsClosing(false);
    }
  };

  const totalPlanned = summary.rows.reduce((acc, row) => acc + row.planned, 0);
  const totalSpent = summary.rows.reduce((acc, row) => acc + row.spent, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chiudi il ciclo"
        subtitle={summary.cycle.label}
        breadcrumb={{ to: '/soldi', label: 'Soldi' }}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Allocato" value={<Money cents={totalPlanned} compact />} />
        <StatCard
          label="Speso"
          value={<Money cents={totalSpent} compact />}
          tone={totalSpent > totalPlanned ? 'bad' : 'neutral'}
          progress={totalPlanned > 0 ? totalSpent / totalPlanned : undefined}
        />
      </div>

      <Card>
        <h2 className="kpi-label mb-3">Bucket per bucket</h2>
        <ul className="divide-y divide-white/[0.04]">
          {summary.rows.map((row) => (
            <li key={row.bucketId} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{row.name}</p>
                <p className="text-sm text-white/45">
                  {row.carries ? 'Riporta l’avanzo' : 'L’avanzo non si riporta'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <Money cents={row.leftover} semanticColor showSign className="font-medium" />
                <p className="text-sm text-white/45 tabular-nums">
                  <Money cents={row.spent} compact /> di <Money cents={row.planned} compact />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="kpi-label">Riporto al ciclo successivo</p>
            <p className="text-sm text-white/45">{summary.nextLabel}</p>
          </div>
          <Money
            cents={summary.carryOver.openingBalance}
            semanticColor
            showSign
            className="kpi-number"
          />
        </div>

        {summary.carryOver.forfeited > 0 && (
          <>
            <Divider />
            <p className="text-sm text-white/45">
              <Money cents={summary.carryOver.forfeited} /> restano nei bucket che non riportano:
              non finiscono nel ciclo successivo.
            </p>
          </>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => void handleClose()} disabled={isClosing} fullWidth>
          Chiudi il ciclo e apri {summary.nextLabel}
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
        <Button variant="quiet" onClick={() => navigate('/soldi')} disabled={isClosing}>
          Non ancora
        </Button>
      </div>
    </div>
  );
}
