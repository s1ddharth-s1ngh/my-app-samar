import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useDataStore } from './stores/useDataStore';
import { GlobalErrorBoundary } from './app/ErrorBoundary';
import { Layout } from './app/Layout';
import ScheduleScreen from './features/schedule/ScheduleScreen';
import { WeekScheduleScreen } from './features/schedule/WeekScheduleScreen';
import FinanceScreen from './features/finance/FinanceScreen';
import ProjectsScreen from './features/projects/ProjectsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { DevUIScreen } from './features/dev/DevUIScreen';
import { ToastContainer } from './ui/Toast';
import { GoalsScreen } from './features/goals/GoalsScreen';
import { onReminderTap, syncReminders } from './lib/notifier';
import { getSupabaseClient, isSupabaseConfigured } from './data/supabase/client';
import { requestCloudSync, syncCloud, useCloudStore } from './stores/cloud';

import { IncomeSourcesScreen } from './features/finance/sources/IncomeSourcesScreen';
import { BucketsScreen } from './features/finance/buckets/BucketsScreen';
import { BucketDetailScreen } from './features/finance/buckets/BucketDetailScreen';
import { AllocationRulesScreen } from './features/finance/allocations/AllocationRulesScreen';
import { RecurringExpensesScreen } from './features/finance/recurring/RecurringExpensesScreen';
import { IncomeEntriesScreen } from './features/finance/income/IncomeEntriesScreen';
import { TransactionsScreen } from './features/finance/transactions/TransactionsScreen';
import { CycleAllocationsScreen } from './features/finance/allocations/CycleAllocationsScreen';
import { CycleCloseScreen } from './features/cycles/CycleCloseScreen';

// Charts pull in Recharts: loaded only when the history screen is opened.
const HistoryScreen = lazy(() =>
  import('./features/finance/history/HistoryScreen').then((module) => ({
    default: module.HistoryScreen,
  }))
);
import { ProjectDetailsScreen } from './features/projects/ProjectDetailsScreen';

/**
 * Keeps the platform's alarms in step with the goals.
 *
 * Reruns on every change to a task or to the settings, and whenever the app
 * comes back to the front: that second one is what refills the horizon, since
 * only sixty days of alarms are programmed at a time.
 */
function Reminders() {
  const tasks = useDataStore((state) => state.tasks);
  const settings = useDataStore((state) => state.settings);
  const navigate = useNavigate();

  useEffect(() => {
    void syncReminders(tasks, settings);
  }, [tasks, settings]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const { tasks: current, settings: now } = useDataStore.getState();
      void syncReminders(current, now);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => onReminderTap((path) => navigate(path)), [navigate]);

  return null;
}

/** Starts cloud sync after local data has hydrated and whenever auth or network changes. */
function CloudBridge() {
  const hydrate = useDataStore((state) => state.hydrate);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseClient();
    const run = () => void syncCloud(hydrate);
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      useCloudStore.setState({
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
        status: session ? 'idle' : 'local',
      });
      setTimeout(requestCloudSync, 0);
    });
    window.addEventListener('samar:sync', run);
    window.addEventListener('online', run);
    document.addEventListener('visibilitychange', onVisible);
    void client.auth.getSession().then(({ data }) => {
      useCloudStore.setState({
        userId: data.session?.user.id ?? null,
        email: data.session?.user.email ?? null,
      });
      requestCloudSync();
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('samar:sync', run);
      window.removeEventListener('online', run);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [hydrate]);

  return null;
}

export default function App() {
  const hydrate = useDataStore((state) => state.hydrate);
  const isHydrated = useDataStore((state) => state.isHydrated);
  const [failed, setFailed] = useState(false);

  // Everything on screen reads the store, and the store starts empty: nothing
  // renders truthfully until IndexedDB has been read once.
  useEffect(() => {
    hydrate().catch(() => setFailed(true));
  }, [hydrate]);

  // Private windows and blocked site data leave us with no database at all.
  // Saying so beats a spinner that never stops.
  if (failed) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center text-[13px] text-white/60">
        Non riesco ad aprire l’archivio locale. Controlla che il browser permetta i dati dei siti,
        poi ricarica la pagina.
      </div>
    );
  }

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center text-[12px] text-white/35">
        Carico i tuoi dati…
      </div>
    );
  }

  return (
    <Router>
      <GlobalErrorBoundary>
        <Reminders />
        <CloudBridge />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ScheduleScreen />} />
            <Route path="agenda/schema" element={<WeekScheduleScreen />} />
            <Route path="soldi">
              <Route index element={<FinanceScreen />} />
              <Route path="fonti" element={<IncomeSourcesScreen />} />
              <Route path="bucket" element={<BucketsScreen />} />
              <Route path="bucket/:bucketId" element={<BucketDetailScreen />} />
              <Route path="allocazioni" element={<AllocationRulesScreen />} />
              <Route path="ricorrenti" element={<RecurringExpensesScreen />} />
              <Route path="entrate" element={<IncomeEntriesScreen />} />
              <Route path="movimenti" element={<TransactionsScreen />} />
              <Route path="ripartizione" element={<CycleAllocationsScreen />} />
              <Route
                path="storico"
                element={
                  <Suspense
                    fallback={<p className="text-sm text-muted-foreground">Carico lo storico…</p>}
                  >
                    <HistoryScreen />
                  </Suspense>
                }
              />
              <Route path="chiusura" element={<CycleCloseScreen />} />
            </Route>
            <Route path="progetti">
              <Route index element={<ProjectsScreen />} />
              <Route path=":id" element={<ProjectDetailsScreen />} />
            </Route>
            <Route path="obiettivi" element={<GoalsScreen />} />
            <Route path="impostazioni" element={<SettingsScreen />} />
          </Route>
          {import.meta.env.DEV && <Route path="/dev/ui" element={<DevUIScreen />} />}
        </Routes>
        <ToastContainer />
      </GlobalErrorBoundary>
    </Router>
  );
}
