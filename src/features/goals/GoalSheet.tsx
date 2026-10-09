import { useMemo, useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button, Field, Select, Sheet, Toggle, WeekdayPicker } from '@/ui';
import { MICRO_LABEL } from '@/lib/surfaces';
import { reminderTimes } from '@/domain/goals';
import { requestReminderPermission } from '@/lib/notifier';
import { newTask, nextOrder } from '@/features/tasks/taskModel';
import type { Task } from '@/data/types';
import {
  BEFORE_DUE_OPTIONS,
  EMPTY_GOAL_FORM,
  WEEKDAY_PRESETS,
  formatFireTime,
  toGoalFields,
  toGoalForm,
  validateGoalForm,
} from './goalModel';

export interface GoalSheetProps {
  /** The goal being edited, or null to create one. */
  goal: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

/** How far ahead the preview looks: three weeks is enough to read a cadence. */
const PREVIEW_DAYS = 21;

export function GoalSheet({ goal, isOpen, onClose }: GoalSheetProps) {
  const tasks = useDataStore((state) => state.tasks);
  const createItem = useDataStore((state) => state.createItem);
  const updateItem = useDataStore((state) => state.updateItem);
  const addToast = useToastStore((state) => state.addToast);

  // The caller remounts this sheet per goal (see its `key`), so initialising
  // from the prop once is enough.
  const [form, setForm] = useState(goal ? toGoalForm(goal) : EMPTY_GOAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // The same function the scheduler uses: what is written here is what rings.
  const preview = useMemo(() => {
    if (form.dueDate === '') return [];
    const draft: Task = { ...(goal ?? newTask({ title: form.title })), ...toGoalFields(form) };
    return reminderTimes(draft, new Date(), PREVIEW_DAYS).slice(0, 3);
  }, [form, goal]);

  const handleSave = async () => {
    const found = validateGoalForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const fields = toGoalFields(form);

    try {
      if (goal) {
        await updateItem('tasks', goal.id, fields);
      } else {
        await createItem('tasks', newTask({ ...fields, order: nextOrder(tasks, null) }));
      }
      // Asked here, on a real click: Safari refuses the prompt without one.
      if (form.recurring || form.beforeDue) await requestReminderPermission();

      onClose();
      addToast(goal ? 'Obiettivo aggiornato.' : 'Obiettivo creato.', 'success');
    } catch {
      // The store already reported the failure.
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? "Modifica l'obiettivo" : 'Nuovo obiettivo'}
    >
      <div className="space-y-4 py-2">
        <Field
          label="Obiettivo"
          value={form.title}
          error={errors.title}
          placeholder="Finire il corso di tedesco"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <Field
          label="Entro il"
          type="date"
          value={form.dueDate}
          error={errors.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />

        <Field
          label="Note"
          value={form.notes}
          placeholder="Facoltative"
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <div className="space-y-3 border-t border-white/[0.06] pt-3">
          <Toggle
            label="Promemoria ricorrenti"
            description="Ti scrivo nei giorni che scegli, fino alla data."
            checked={form.recurring}
            onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
          />

          {form.recurring && (
            <div className="space-y-3 pl-0.5">
              <WeekdayPicker
                label="Giorni"
                value={form.byWeekday}
                error={errors.byWeekday}
                onChange={(byWeekday) => setForm({ ...form, byWeekday })}
              />
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    onClick={() => setForm({ ...form, byWeekday: preset.days })}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Field
                label="Ora"
                type="time"
                value={form.timeOfDay}
                onChange={(e) => setForm({ ...form, timeOfDay: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-white/[0.06] pt-3">
          <Toggle
            label="Avvisami prima della scadenza"
            description="Un solo promemoria, vicino alla data."
            checked={form.beforeDue}
            onChange={(e) => setForm({ ...form, beforeDue: e.target.checked })}
          />

          {form.beforeDue && (
            <Select
              label="Quando"
              options={BEFORE_DUE_OPTIONS}
              value={form.offsetMinutes}
              error={errors.beforeDue}
              onChange={(e) => setForm({ ...form, offsetMinutes: e.target.value })}
            />
          )}
          {!form.beforeDue && errors.beforeDue && (
            <p className="text-[11px] text-red-300">{errors.beforeDue}</p>
          )}
        </div>

        <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
          <span className={MICRO_LABEL}>Prossimi promemoria</span>
          {preview.length > 0 ? (
            <ul className="space-y-0.5">
              {preview.map((time) => (
                <li key={time.at.getTime()} className="text-[12px] text-white/70">
                  {formatFireTime(time.at)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-white/35">
              Scegli una data e una cadenza per vederli qui.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button className="flex-1" size="md" onClick={() => void handleSave()}>
            {goal ? 'Salva' : 'Crea obiettivo'}
          </Button>
          <Button variant="quiet" size="md" onClick={onClose}>
            Annulla
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
