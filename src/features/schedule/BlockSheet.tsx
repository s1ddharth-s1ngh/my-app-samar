import { useState } from 'react';
import { useToastStore } from '@/stores/toast';
import { Button, Divider, Field, Select, Sheet } from '@/ui';
import { MICRO_LABEL } from '@/lib/surfaces';
import { isoWeekday, isTemplate, weekdayName } from '@/domain/schedule';
import { parseCalendarDate } from '@/domain/cycles';
import type { CalendarDate, ScheduleBlock, ScheduleKind } from '@/data/types';
import { KIND_OPTIONS } from './kinds';
import { useSchedule, type BlockDraft, type Scope } from './useSchedule';

const SHORT_DATE = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

export interface BlockSheetProps {
  onClose: () => void;
  /** `null` opens the sheet on a new block. */
  block: ScheduleBlock | null;
  date: CalendarDate;
  /** The weekly editor has no single day: only the weekly scope exists there. */
  weekOnly?: boolean;
}

const EMPTY: BlockDraft = { title: '', kind: 'custom', start: '09:00', end: '10:00' };

/**
 * Editing a block always answers one question first: does this change today,
 * or every week? The two save buttons are that question — there is no hidden
 * default, because guessing it wrong silently rewrites your whole week.
 *
 * Mounted only while open, so the draft starts from the block it was opened on
 * and needs no effect to keep the two in step.
 */
export function BlockSheet({ onClose, block, date, weekOnly = false }: BlockSheetProps) {
  const { save, remove } = useSchedule();
  const addToast = useToastStore((state) => state.addToast);

  const [draft, setDraft] = useState<BlockDraft>(() =>
    block ? { title: block.title, kind: block.kind, start: block.start, end: block.end } : EMPTY
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const weekday = weekdayName(isoWeekday(date || block?.date || ''));
  const dayLabel = date ? SHORT_DATE.format(parseCalendarDate(date)) : '';

  const run = async (action: () => Promise<void>) => {
    setIsSaving(true);
    try {
      await action();
      onClose();
    } catch {
      // The store has already told the user and rolled back.
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = (scope: Scope) => {
    if (draft.title.trim() === '') {
      setError('Dai un nome al blocco.');
      return;
    }
    if (draft.end <= draft.start) {
      setError("La fine deve venire dopo l'inizio.");
      return;
    }

    void run(async () => {
      await save(block, { ...draft, title: draft.title.trim() }, date, scope);
      addToast(
        scope === 'week' ? `Aggiornato ogni ${weekday}.` : 'Aggiornato solo per oggi.',
        'success'
      );
    });
  };

  const handleDelete = (scope: Scope) => {
    if (!block) return;
    void run(async () => {
      await remove(block, date, scope);
      addToast(scope === 'week' ? 'Rimosso dall’orario.' : 'Saltato per oggi.', 'info');
    });
  };

  return (
    <Sheet isOpen onClose={onClose} title={block ? 'Modifica blocco' : 'Nuovo blocco'}>
      <div className="space-y-4">
        <Field
          label="Titolo"
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder="Palestra"
          autoFocus
        />

        <Select
          label="Tipo"
          options={KIND_OPTIONS}
          value={draft.kind}
          onChange={(event) => setDraft({ ...draft, kind: event.target.value as ScheduleKind })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Inizio"
            type="time"
            value={draft.start}
            onChange={(event) => setDraft({ ...draft, start: event.target.value })}
          />
          <Field
            label="Fine"
            type="time"
            value={draft.end}
            onChange={(event) => setDraft({ ...draft, end: event.target.value })}
          />
        </div>

        {error && <p className="text-[11px] text-red-300">{error}</p>}

        <div className="space-y-2">
          <p className={MICRO_LABEL}>Applica a</p>
          {weekOnly ? (
            <Button size="md" fullWidth disabled={isSaving} onClick={() => handleSave('week')}>
              Salva
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="quiet"
                size="md"
                disabled={isSaving}
                onClick={() => handleSave('day')}
              >
                Solo il {dayLabel}
              </Button>
              <Button size="md" disabled={isSaving} onClick={() => handleSave('week')}>
                Ogni {weekday}
              </Button>
            </div>
          )}
        </div>

        {block && (
          <>
            <Divider />
            <div className="space-y-2">
              <p className={MICRO_LABEL}>Elimina</p>
              {weekOnly ? (
                <Button
                  variant="danger"
                  size="md"
                  fullWidth
                  disabled={isSaving}
                  onClick={() => handleDelete('week')}
                >
                  Elimina dall’orario
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="quiet"
                    size="md"
                    disabled={isSaving}
                    onClick={() => handleDelete('day')}
                  >
                    Salta il {dayLabel}
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    disabled={isSaving || (!isTemplate(block) && !block.templateId)}
                    onClick={() => handleDelete('week')}
                  >
                    Ogni {weekday}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
