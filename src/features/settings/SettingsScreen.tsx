import { useDataStore } from '@/stores/useDataStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { Button, Card, CardHeader, PageHeader, TabPills } from '@/ui';
import { GLASS_TRANSPARENCY_PRESETS } from '@/lib/glass';
import { FinancialSettingsSection } from './FinancialSettingsSection';
import { NotificationsSection } from './NotificationsSection';
import { SupabaseSection } from './SupabaseSection';

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
    <div className="space-y-3">
      <PageHeader title="Impostazioni" subtitle="Aspetto, denaro e dati" />

      <Card>
        <CardHeader title="Aspetto" subtitle="Tema dell'app e trasparenza del vetro." />
        <div className="mb-5 space-y-1.5">
          <p className="kpi-label">Tema</p>
          <TabPills
            ariaLabel="Tema dell'app"
            value={theme}
            onChange={setTheme}
            items={[
              { id: 'light', label: 'Chiaro' },
              { id: 'dark', label: 'Scuro' },
              { id: 'system', label: 'Sistema' },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <p className="kpi-label">Trasparenza del vetro</p>
          <TabPills
            ariaLabel="Trasparenza del vetro"
            value={String(glassTransparency)}
            onChange={(value: string) => setGlassTransparency(Number(value))}
            items={GLASS_TRANSPARENCY_PRESETS.map((preset) => ({
              id: String(preset.value),
              label: preset.label,
            }))}
          />
          <p className="text-[11px] text-white/35">
            Sfoca e opacizza insieme, come il cursore di iOS 27. Se hai chiesto meno trasparenza al
            sistema, il vetro resta opaco comunque.
          </p>
        </div>
      </Card>

      <Card>
        <NotificationsSection />
      </Card>

      <Card>
        <FinancialSettingsSection />
      </Card>

      <Card>
        <SupabaseSection />
      </Card>

      <Card>
        <CardHeader
          title="Dati"
          subtitle="I dati di esempio sostituiscono tutto. Svuotare è irreversibile."
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="quiet" onClick={() => void handleLoadSeed()}>
            Carica i dati di esempio
          </Button>
          <Button variant="danger" onClick={() => void handleReset()}>
            Svuota tutto
          </Button>
        </div>
      </Card>
    </div>
  );
}
