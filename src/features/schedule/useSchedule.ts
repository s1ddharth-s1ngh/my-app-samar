import { useDataStore } from '@/stores/useDataStore';
import { newBase, nowInstant } from '@/lib/record';
import { isoWeekday, isTemplate } from '@/domain/schedule';
import { defaultScheduleBlocks } from '@/data/defaults';
import type { CalendarDate, ScheduleBlock } from '@/data/types';

export type BlockDraft = Pick<ScheduleBlock, 'title' | 'kind' | 'start' | 'end'>;

/**
 * How far a change reaches — the one question every edit to the agenda has to
 * answer, because a block on screen is a weekly template seen through one day.
 *
 *   'day'   this date only: writes an exception that overrides the template
 *   'week'  every <weekday> from now on: writes the template itself
 */
export type Scope = 'day' | 'week';

/**
 * Every mutation the agenda needs, in one place. The screens decide *what*
 * the user meant; this decides which rows that turns into.
 */
export function useSchedule() {
  const blocks = useDataStore((state) => state.scheduleBlocks);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const removeItem = useDataStore((state) => state.removeItem);

  const patch = (id: string, data: Partial<ScheduleBlock>) =>
    updateItem('scheduleBlocks', id, { ...data, updatedAt: nowInstant() });

  /** Exceptions pointing at a template, so deleting it does not leave orphans. */
  const exceptionsOf = (templateId: string) =>
    blocks.filter((b) => b.templateId === templateId && !b.deletedAt);

  async function save(
    existing: ScheduleBlock | null,
    draft: BlockDraft,
    date: CalendarDate,
    scope: Scope
  ): Promise<void> {
    // A brand new block.
    if (!existing) {
      await createItem('scheduleBlocks', {
        ...newBase(),
        ...draft,
        byWeekday: scope === 'week' ? [isoWeekday(date)] : [],
        date: scope === 'week' ? null : date,
        templateId: null,
        skipped: false,
      });
      return;
    }

    // A weekly template, seen through one day.
    if (isTemplate(existing)) {
      if (scope === 'week') {
        await patch(existing.id, draft);
        return;
      }
      await createItem('scheduleBlocks', {
        ...newBase(),
        ...draft,
        byWeekday: [],
        date,
        templateId: existing.id,
        skipped: false,
      });
      return;
    }

    // Already an exception.
    if (scope === 'day') {
      await patch(existing.id, draft);
      return;
    }

    if (existing.templateId) {
      // The change belongs to the template; the exception has nothing left to say.
      await patch(existing.templateId, draft);
      await removeItem('scheduleBlocks', existing.id);
      return;
    }

    // A one-off block promoted to a weekly one.
    await patch(existing.id, { ...draft, date: null, byWeekday: [isoWeekday(date)] });
  }

  async function remove(block: ScheduleBlock, date: CalendarDate, scope: Scope): Promise<void> {
    if (isTemplate(block)) {
      if (scope === 'week') {
        for (const exception of exceptionsOf(block.id)) {
          await removeItem('scheduleBlocks', exception.id);
        }
        await removeItem('scheduleBlocks', block.id);
        return;
      }
      // Keep the template, hide it for this one day.
      await createItem('scheduleBlocks', {
        ...newBase(),
        title: block.title,
        kind: block.kind,
        start: block.start,
        end: block.end,
        byWeekday: [],
        date,
        templateId: block.id,
        skipped: true,
      });
      return;
    }

    if (scope === 'week' && block.templateId) {
      for (const exception of exceptionsOf(block.templateId)) {
        await removeItem('scheduleBlocks', exception.id);
      }
      await removeItem('scheduleBlocks', block.templateId);
      return;
    }

    // An exception that overrides a template becomes a skip, so deleting it
    // removes the block from the day instead of bringing the template back.
    if (block.templateId) {
      await patch(block.id, { skipped: true });
      return;
    }

    await removeItem('scheduleBlocks', block.id);
  }

  async function toggleWeekday(template: ScheduleBlock, weekday: number): Promise<void> {
    const next = template.byWeekday.includes(weekday)
      ? template.byWeekday.filter((day) => day !== weekday)
      : [...template.byWeekday, weekday].sort((a, b) => a - b);

    // The last day removed would make the template invisible and unreachable.
    if (next.length === 0) {
      await remove(template, '', 'week');
      return;
    }

    await patch(template.id, { byWeekday: next });
  }

  /** The starting week, on request — never written behind the user's back. */
  async function installDefaults(): Promise<void> {
    for (const block of defaultScheduleBlocks()) {
      await createItem('scheduleBlocks', block);
    }
  }

  return { blocks, save, remove, toggleWeekday, installDefaults };
}
