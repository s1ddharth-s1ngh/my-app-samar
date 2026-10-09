import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Layers,
  LayoutGrid,
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
  TabPills,
  TabPanel,
  type TabPillItem,
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
import { blocksForDate, shiftRange, weekDates, type CalendarView } from '@/domain/schedule';
import type { CalendarDate, ScheduleBlock } from '@/data/types';
import { Timeline } from './Timeline';
import { MonthGrid } from './MonthGrid';
import { YearGrid } from './YearGrid';
import { BlockSheet } from './BlockSheet';
import { useSchedule } from './useSchedule';
import type { BlockDraft } from './useSchedule';

const VIEWS: readonly TabPillItem<CalendarView>[] = [
  { id: 'giorno', label: 'Giorno', icon: CalendarDays },
  { id: 'settimana', label: 'Settimana', icon: CalendarRange },
  { id: 'mese', label: 'Mese', icon: LayoutGrid },
  { id: 'anno', label: 'Anno', icon: Grid3x3 },
];

const CARD_TITLE: Record<CalendarView, string> = {
  giorno: 'La giornata',
  settimana: 'La settimana',
  mese: 'Il mese',
  anno: "L'anno",
};

const STEP_LABEL: Record<CalendarView, string> = {
  giorno: 'Giorno',
  settimana: 'Settimana',
  mese: 'Mese',
  anno: 'Anno',
};

const LONG_DATE = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const DAY_MONTH = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });
const MONTH_YEAR = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' });

const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** What the header says you are looking at. */
function rangeLabel(date: CalendarDate, view: CalendarView): string {
  const asDate = parseCalendarDate(date);

  if (view === 'giorno') return capitalise(LONG_DATE.format(asDate));
  if (view === 'anno') return date.slice(0, 4);
  if (view === 'mese') return capitalise(MONTH_YEAR.format(asDate));

  const week = weekDates(date);
  const first = parseCalendarDate(week[0]!);
  const last = parseCalendarDate(week[6]!);
  return `${DAY_MONTH.format(first)} – ${DAY_MONTH.format(last)} ${week[6]!.slice(0, 4)}`;
}

/**
 * The agenda, in the four ranges a calendar is ever read at. One route and one
 * selected date: the view only decides how much of it is drawn, so switching
 * from month to day keeps you on the day you were looking at.
 */
export default function ScheduleScreen() {
  const { blocks, installDefaults } = useSchedule();
  const totals = useCycleTotals();

  const [view, setView] = useState<CalendarView>('giorno');
  const [date, setDate] = useState(todayCalendarDate());

  const [editing, setEditing] = useState<ScheduleBlock | null>(null);
  const [sheetDate, setSheetDate] = useState(date);
  const [newDraft, setNewDraft] = useState<BlockDraft | undefined>();
  const [isSheetOpen, setSheetOpen] = useState(false);

  const day = blocksForDate(blocks, date);
  const isOnToday = date === todayCalendarDate();

  const elapsed = totals.cycle
    ? daysElapsed(
        { startDate: totals.cycle.startDate, endDate: totals.cycle.endDate },
        todayCalendarDate()
      )
    : 0;
  const length = totals.cycle
    ? cycleLengthInDays({ startDate: totals.cycle.startDate, endDate: totals.cycle.endDate })
    : 0;

  const openBlock = (block: ScheduleBlock) => {
    setEditing(block);
    setSheetDate(block.date ?? date);
    setNewDraft(undefined);
    setSheetOpen(true);
  };

  const openNew = (on: CalendarDate, draft?: BlockDraft) => {
    setEditing(null);
    setSheetDate(on);
    setNewDraft(draft);
    setSheetOpen(true);
  };

  /** Clicking a day anywhere in the month or year grid opens it. */
  const pickDate = (picked: CalendarDate) => {
    setDate(picked);
    setView('giorno');
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Agenda"
        subtitle={rangeLabel(date, view)}
        actions={
          <>
            <IconButton
              icon={ChevronLeft}
              label={`${STEP_LABEL[view]} precedente`}
              onClick={() => setDate(shiftRange(date, view, -1))}
            />
            <Button
              variant="quiet"
              disabled={isOnToday}
              onClick={() => setDate(todayCalendarDate())}
            >
              Oggi
            </Button>
            <IconButton
              icon={ChevronRight}
              label={`${STEP_LABEL[view]} successivo`}
              onClick={() => setDate(shiftRange(date, view, 1))}
            />
          </>
        }
      />

      <TabPills items={VIEWS} value={view} onChange={setView} ariaLabel="Vista del calendario" />

      <Card>
        <CardHeader
          title={CARD_TITLE[view]}
          subtitle={view === 'giorno' && day.length > 0 ? `${day.length} blocchi` : undefined}
          action={
            <div className="flex items-center gap-2">
              <Link to="/agenda/schema" className={LINK_SOFT}>
                Schema settimanale
              </Link>
              <Button onClick={() => openNew(date)}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Blocco
              </Button>
            </div>
          }
        />

        <TabPanel value={view} label={CARD_TITLE[view]}>
          {view === 'giorno' && day.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Giornata libera"
              description="Nessun blocco previsto. Parti dall’orario predefinito — lavoro 8:30–17:00 e pausa pranzo, dal lunedì al venerdì — oppure aggiungi il tuo."
              actions={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="quiet" size="md" onClick={() => void installDefaults()}>
                    Usa l’orario predefinito
                  </Button>
                  <Button size="md" onClick={() => openNew(date)}>
                    Aggiungi blocco
                  </Button>
                </div>
              }
            />
          ) : view === 'giorno' || view === 'settimana' ? (
            <Timeline
              dates={view === 'giorno' ? [date] : weekDates(date)}
              blocks={blocks}
              onSelect={openBlock}
              onCreate={(on, start, end) => openNew(on, { title: '', kind: 'custom', start, end })}
              onPickDate={pickDate}
            />
          ) : view === 'mese' ? (
            <MonthGrid date={date} blocks={blocks} onPickDate={pickDate} onSelect={openBlock} />
          ) : (
            <YearGrid
              date={date}
              blocks={blocks}
              onPickDate={pickDate}
              onPickMonth={(month) => {
                setDate(month);
                setView('mese');
              }}
            />
          )}
        </TabPanel>
      </Card>

      {view === 'giorno' && (
        <>
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
        </>
      )}

      {isSheetOpen && (
        <BlockSheet
          onClose={() => setSheetOpen(false)}
          block={editing}
          date={sheetDate}
          initialDraft={newDraft}
        />
      )}
    </div>
  );
}
