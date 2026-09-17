import { useMemo } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Card, Field, Select, Toggle } from '@/ui';
import type { Settings } from '@/data/types';
import { computeCycleBounds, getTodayDate } from '@/features/cycles/engine';
import { newBase } from '@/lib/record';

const CYCLE_MODE_OPTIONS = [
  { value: 'calendarMonth', label: 'Mese solare (dal 1 all’ultimo giorno)' },
  { value: 'paydayToPayday', label: 'Stipendio → stipendio' },
];

/** Settings the app falls back to before the user has saved anything. */
export function defaultSettings(): Settings {
  return {
    ...newBase(),
    currency: 'EUR',
    locale: 'it-IT',
    weekStartsOn: 1,
    cycleMode: 'calendarMonth',
    paydayAnchor: 27,
    theme: 'system',
    notificationsEnabled: false,
    quietHours: null,
  };
}

function isCycleMode(value: string): value is Settings['cycleMode'] {
  return value === 'calendarMonth' || value === 'paydayToPayday';
}

const DATE_FORMAT = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long' });

function describeBounds(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  return DATE_FORMAT.format(start) + ' → ' + DATE_FORMAT.format(end);
}

export function FinancialSettingsSection() {
  const settings = useDataStore((state) => state.settings);
  const updateSettings = useDataStore((state) => state.updateSettings);
  const addToast = useToastStore((state) => state.addToast);

  const current = settings ?? defaultSettings();

  // Preview of the cycle the current configuration would produce today.
  const preview = useMemo(
    () => computeCycleBounds(getTodayDate(), current.cycleMode, current.paydayAnchor),
    [current.cycleMode, current.paydayAnchor]
  );

  const save = async (patch: Partial<Settings>) => {
    try {
      await updateSettings({ ...current, ...patch, updatedAt: new Date().toISOString() });
    } catch {
      // The store already reported the failure.
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold text-ink">Denaro</h2>
        <p className="text-sm text-ink-muted">
          Come si misura un ciclo e cosa si porta avanti da un ciclo all’altro.
        </p>
      </div>

      <Select
        label="Modalità del ciclo"
        value={current.cycleMode}
        onChange={(e) => {
          if (isCycleMode(e.target.value)) void save({ cycleMode: e.target.value });
        }}
        options={CYCLE_MODE_OPTIONS}
      />

      {current.cycleMode === 'paydayToPayday' && (
        <Field
          label="Giorno di ancoraggio"
          type="number"
          min={1}
          max={31}
          value={current.paydayAnchor}
          onChange={(e) => {
            const day = Number(e.target.value);
            if (day >= 1 && day <= 31) void save({ paydayAnchor: day });
          }}
          helpText="Il giorno in cui inizia il ciclo. Nei mesi più corti si usa l’ultimo giorno disponibile."
        />
      )}

      <Card padding="sm" className="space-y-1">
        <p className="text-sm text-ink-muted">Con queste impostazioni, il ciclo di oggi sarebbe</p>
        <p className="font-heading text-lg font-semibold text-ink tabular-nums">
          {describeBounds(preview.startDate, preview.endDate)}
        </p>
      </Card>

      <Field
        label="Valuta"
        value="Euro (€)"
        readOnly
        disabled
        helpText="Per ora l’app gestisce una sola valuta."
      />

      <Toggle
        label="Riporta l’avanzo al ciclo successivo"
        description="Tutti i bucket riportano il non speso, tranne le spese correnti."
        checked
        disabled
        onChange={() => addToast('Il riporto non è ancora configurabile per bucket.', 'info')}
      />
    </section>
  );
}
