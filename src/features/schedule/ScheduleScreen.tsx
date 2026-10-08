import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Layers,
  PiggyBank,
  Plus,
  Wallet,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconButton,
  Money,
  PageHeader,
  StatCard,
} from '@/ui';
import { LINK_SOFT } from '@/lib/surfaces';
import { CycleBanner } from '../cycles/CycleBanner';
import { QuickSpendForm } from './QuickSpendForm';
import { useCycleTotals } from '../finance/useCycleTotals';
import {
  cycleLengthInDays,
  daysElapsed,
  parseCalendarDate,
  todayCalendarDate,
} from '@/domain/cycles';
import { blocksForDate, shiftDate } from '@/domain/schedule';
import type { ScheduleBlock } from '@/data/types';
import { DayTimeline } from './DayTimeline';
import { BlockSheet } from './BlockSheet';
import { useSchedule } from './useSchedule';

const LONG_DATE = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * The day, not the date: the agenda first, the money the day costs underneath.
 * Any day can be opened, because a block edited "only today" needs a tomorrow
 * to be edited on.
 */
export default function ScheduleScreen() {
  const { blocks, installDefaults } = useSchedule();
  const totals = useCycleTotals();

  const [date, setDate] = useState(todayCalendarDate());
  const [editing, setEditing] = useState<ScheduleBlock | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);

  const day = blocksForDate(blocks, date);
  const isToday = date === todayCalendarDate();

  const elapsed = totals.cycle
    ? daysElapsed(
        { startDate: totals.cycle.startDate, endDate: totals.cycle.endDate },
        todayCalendarDate()
      )
    : 0;
  const length = totals.cycle
    ? cycleLengthInDays({ startDate: totals.cycle.startDate, endDate: totals.cycle.endDate })
    : 0;

  const openSheet = (block: ScheduleBlock | null) => {
    setEditing(block);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Agenda"
        subtitle={capitalise(LONG_DATE.format(parseCalendarDate(date)))}
        actions={
          <>
            <IconButton
              icon={ChevronLeft}
              label="Giorno precedente"
              onClick={() => setDate(shiftDate(date, -1))}
            />
            <Button variant="quiet" disabled={isToday} onClick={() => setDate(todayCalendarDate())}>
              Oggi
            </Button>
            <IconButton
              icon={ChevronRight}
              label="Giorno successivo"
              onClick={() => setDate(shiftDate(date, 1))}
            />
          </>
        }
      />

      <Card>
        <CardHeader
          title="La giornata"
          subtitle={day.length === 0 ? undefined : `${day.length} blocchi`}
          action={
            <div className="flex items-center gap-2">
              <Link to="/agenda/schema" className={LINK_SOFT}>
                Schema settimanale
              </Link>
              <Button onClick={() => openSheet(null)}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Blocco
              </Button>
            </div>
          }
        />

        {day.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Giornata libera"
            description="Nessun blocco previsto. Parti dall’orario predefinito — lavoro 8:30–17:00 e pausa pranzo, dal lunedì al venerdì — oppure aggiungi il tuo."
            actions={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="quiet" size="md" onClick={() => void installDefaults()}>
                  Usa l’orario predefinito
                </Button>
                <Button size="md" onClick={() => openSheet(null)}>
                  Aggiungi blocco
                </Button>
              </div>
            }
          />
        ) : (
          <DayTimeline date={date} blocks={day} onSelect={openSheet} />
        )}
      </Card>

      <CycleBanner />

      {totals.cycle && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Disponibile"
            value={<Money cents={totals.available} compact />}
            icon={Wallet}
            tone={totals.available < 0 ? 'bad' : 'brand'}
            hint={totals.available < 0 ? 'Sei oltre il budget' : 'Su tutti i bucket'}
          />
          <StatCard
            label="Entrate"
            value={<Money cents={totals.income} compact />}
            icon={PiggyBank}
            hint={
              totals.income === totals.incomeReceived
                ? 'Tutte confermate'
                : 'Incluse quelle previste'
            }
          />
          <StatCard
            label="Allocato"
            value={<Money cents={totals.allocated} compact />}
            icon={Layers}
          />
          <StatCard
            label="Speso"
            value={<Money cents={totals.spent} compact />}
            icon={ArrowDownRight}
            progress={totals.allocated > 0 ? totals.spent / totals.allocated : undefined}
            tone={totals.spent > totals.allocated ? 'bad' : 'neutral'}
            hint={length > 0 ? `Giorno ${elapsed} di ${length}` : undefined}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <QuickSpendForm />
        </div>
      </div>

      {isSheetOpen && (
        <BlockSheet onClose={() => setSheetOpen(false)} block={editing} date={date} />
      )}
    </div>
  );
}
