import { useDataStore } from '@/stores/useDataStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { Select } from '@/ui';

export function SettingsScreen() {
  const loadSeed = useDataStore((state) => state.loadSeed);
  const resetAll = useDataStore((state) => state.resetAll);
  const { theme, setTheme } = useThemeStore();

  const handleLoadSeed = async () => {
    if (
      confirm('Vuoi davvero caricare i dati di esempio? Tutti i dati attuali verranno sostituiti.')
    ) {
      await loadSeed();
      window.location.reload(); // Hard reload for simplicity in this demo
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
    <div className="p-4 space-y-8 max-w-[560px] mx-auto">
      <h1 className="text-2xl font-bold">Impostazioni</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Aspetto</h2>
        <Select
          label="Tema dell'applicazione"
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          options={[
            { value: 'light', label: 'Chiaro' },
            { value: 'dark', label: 'Scuro' },
            { value: 'system', label: 'Sistema' },
          ]}
        />
      </section>

      <section className="space-y-4 border p-4 rounded-xl bg-red-50 text-red-900 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50">
        <h2 className="font-semibold text-lg">Area Pericolosa (Sviluppo)</h2>
        <div className="flex gap-4">
          <button
            onClick={handleLoadSeed}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Carica dati di esempio
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
          >
            Svuota tutto
          </button>
        </div>
      </section>
    </div>
  );
}
