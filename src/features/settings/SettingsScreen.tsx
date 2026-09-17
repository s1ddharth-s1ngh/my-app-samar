import { useDataStore } from '@/stores/useDataStore';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/stores/useThemeStore';
import { Button, Card, Select, Divider } from '@/ui';
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
  const { theme, setTheme } = useThemeStore();

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
    <div className="p-4 sm:p-8 space-y-8">
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
