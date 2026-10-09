import { useState } from 'react';
import { CalendarRange, Pencil, Plus } from 'lucide-react';
import { Button, Card, CardHeader, EmptyState, IconButton, PageHeader } from '@/ui';
import { cn } from '@/lib/cn';
import { ICON_ACTION, MICRO_LABEL, ROW_DIVIDE } from '@/lib/surfaces';
import { todayCalendarDate } from '@/domain/cycles';
import { WEEKDAY_LABELS, isTemplate, weekdayName } from '@/domain/schedule';
import type { ScheduleBlock } from '@/data/types';
import { SCHEDULE_KINDS } from './kinds';
import { BlockSheet } from './BlockSheet';
import { useSchedule } from './useSchedule';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

/**
 * The week that repeats. Every row is a template; the day pills say when it
 * happens, and tapping one changes that week from now on — this is where a new
 * habit like the gym gets its days.
 */
export function WeekScheduleScreen() {
  const { blocks, toggleWeekday, installDefaults } = useSchedule();

  const [editing, setEditing] = useState<ScheduleBlock | null>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);

  const templates = blocks
    .filter((block) => !block.deletedAt && isTemplate(block))
    .sort((a, b) => a.start.localeCompare(b.start));

  const openSheet = (block: ScheduleBlock | null) => {
    setEditing(block);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title="Schema settimanale"
        subtitle="I blocchi fissi della settimana. Le eccezioni di un singolo giorno si modificano dall’agenda."
        breadcrumb={{ to: '/', label: 'Agenda' }}
        actions={
          <Button onClick={() => openSheet(null)}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Blocco
          </Button>
        }
      />

      <Card flush>
        {templates.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Nessun blocco fisso"
            description="Parti dall’orario predefinito — lavoro 8:30–17:00 e pausa pranzo, dal lunedì al venerdì — poi aggiungi il resto."
            actions={
              <Button size="md" onClick={() => void installDefaults()}>
                Usa l’orario predefinito
              </Button>
            }
          />
        ) : (
          <div className={cn(ROW_DIVIDE, 'px-4')}>
            {templates.map((template) => {
              const kind = SCHEDULE_KINDS[template.kind];

              return (
                <div key={template.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className={cn('h-8 w-0.5 shrink-0 rounded-full', kind.rail)}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {template.title}
                    </p>
                    <p className="text-[10.5px] text-muted-foreground tabular-nums">
                      {template.start}–{template.end} · {kind.label}
                    </p>
                  </div>

                  <div className="flex items-center gap-1" role="group" aria-label="Giorni">
                    {WEEKDAYS.map((weekday) => {
                      const isOn = template.byWeekday.includes(weekday);
                      return (
                        <button
                          key={weekday}
                          type="button"
                          aria-pressed={isOn}
                          aria-label={`${template.title}, ${weekdayName(weekday)}`}
                          onClick={() => void toggleWeekday(template, weekday)}
                          className={cn(
                            'h-7 w-8 rounded-full text-[10px] font-semibold transition-colors',
                            isOn
                              ? 'bg-brand text-on-brand'
                              : 'bg-foreground/[0.04] text-muted-foreground hover:bg-foreground/[0.08] hover:text-secondary'
                          )}
                        >
                          {WEEKDAY_LABELS[weekday - 1]}
                        </button>
                      );
                    })}
                  </div>

                  <IconButton
                    icon={Pencil}
                    label={`Modifica ${template.title}`}
                    className={ICON_ACTION}
                    onClick={() => openSheet(template)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {templates.length > 0 && (
        <Card>
          <CardHeader title="Come funziona" />
          <ul className="space-y-1.5 text-[11.5px] text-muted-foreground">
            <li>
              <span className={MICRO_LABEL}>Qui</span> — cambi la settimana: vale da adesso in poi,
              su tutti i giorni accesi.
            </li>
            <li>
              <span className={MICRO_LABEL}>Nell’agenda</span> — tocchi un blocco e scegli se la
              modifica vale solo per quel giorno o per ogni settimana.
            </li>
          </ul>
        </Card>
      )}

      {isSheetOpen && (
        <BlockSheet
          onClose={() => setSheetOpen(false)}
          block={editing}
          date={todayCalendarDate()}
          weekOnly
        />
      )}
    </div>
  );
}
