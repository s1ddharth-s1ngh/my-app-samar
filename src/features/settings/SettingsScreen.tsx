import { useDataStore } from '@/stores/useDataStore';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/stores/useThemeStore';
import { Button, Card, Select, Divider, Segmented } from '@/ui';
import { GLASS_TRANSPARENCY_PRESETS } from '@/lib/glass';
import { FinancialSettingsSection } from './FinancialSettingsSection';

const THEME_OPTIONS = [
  { value: 'light', label: 'Chiaro' },
  { value: 'dark', label: 'Scuro' },
  { value: 'system', label: 'Sistema' },
];

function isTheme(value: string): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function SettingsScreen() {
  const loadSeed = useDataStore((state) => state.loadSeed);
  const resetAll = useDataStore((state) => state.resetAll);
  const { theme, setTheme, glassTransparency, setGlassTransparency } = useThemeStore();

  const handleLoadSeed = async () => {
    if (
      confirm('Vuoi davvero caricare i dati di esempio? Tutti i dati attuali verranno sostituiti.')
    ) {
      await loadSeed();
      window.location.reload();
    }
  };

  const handleReset = async () => {
    if (
      confirm('Sei sicuro di voler eliminare TUTTI i tuoi dati? Questa azione è irreversibile.')
    ) {
      await resetAll();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-ink">Impostazioni</h1>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-ink">Aspetto</h2>
        <Select
          label="Tema dell'applicazione"
          value={theme}
          onChange={(e) => {
            if (isTheme(e.target.value)) setTheme(e.target.value);
          }}
          options={THEME_OPTIONS}
        />

        <div className="space-y-1.5">
          <p className="kpi-label">Trasparenza del vetro</p>
          <Segmented
            ariaLabel="Trasparenza del vetro"
            value={String(glassTransparency)}
            onChange={(value) => setGlassTransparency(Number(value))}
            options={GLASS_TRANSPARENCY_PRESETS.map((preset) => ({
              value: String(preset.value),
              label: preset.label,
            }))}
          />
          <p className="text-sm text-muted-foreground">
            Sfoca e opacizza insieme, come il cursore di iOS 27. Se hai chiesto meno trasparenza al
            sistema, il vetro resta opaco comunque.
          </p>
        </div>
      </section>

      <Divider />

      <FinancialSettingsSection />

      <Divider />

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-ink">Dati</h2>
        <Card className="space-y-4" padding="sm">
          <p className="text-sm text-ink-muted">
            I dati di esempio sostituiscono tutto quello che hai adesso. Svuotare è irreversibile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={() => void handleLoadSeed()}>
              Carica i dati di esempio
            </Button>
            <Button variant="destructive" onClick={() => void handleReset()}>
              Svuota tutto
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
