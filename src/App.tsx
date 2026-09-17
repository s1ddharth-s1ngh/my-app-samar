import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GlobalErrorBoundary } from './app/ErrorBoundary';
import { Layout } from './app/Layout';
import TodayScreen from './features/today/TodayScreen';
import FinanceScreen from './features/finance/FinanceScreen';
import ProjectsScreen from './features/projects/ProjectsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { DevUIScreen } from './features/dev/DevUIScreen';
import { ToastContainer } from './ui/Toast';

import { IncomeSourcesScreen } from './features/finance/sources/IncomeSourcesScreen';
import { BucketsScreen } from './features/finance/buckets/BucketsScreen';
import { AllocationRulesScreen } from './features/finance/allocations/AllocationRulesScreen';
import { RecurringExpensesScreen } from './features/finance/recurring/RecurringExpensesScreen';
import { IncomeEntriesScreen } from './features/finance/income/IncomeEntriesScreen';
import { TransactionsScreen } from './features/finance/transactions/TransactionsScreen';
import { CycleCloseScreen } from './features/cycles/CycleCloseScreen';
import { ProjectDetailsScreen } from './features/projects/ProjectDetailsScreen';

export default function App() {
  return (
    <Router>
      <GlobalErrorBoundary>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<TodayScreen />} />
            <Route path="soldi">
              <Route index element={<FinanceScreen />} />
              <Route path="fonti" element={<IncomeSourcesScreen />} />
              <Route path="bucket" element={<BucketsScreen />} />
              <Route path="allocazioni" element={<AllocationRulesScreen />} />
              <Route path="ricorrenti" element={<RecurringExpensesScreen />} />
              <Route path="entrate" element={<IncomeEntriesScreen />} />
              <Route path="movimenti" element={<TransactionsScreen />} />
              <Route path="chiusura" element={<CycleCloseScreen />} />
            </Route>
            <Route path="progetti">
              <Route index element={<ProjectsScreen />} />
              <Route path=":id" element={<ProjectDetailsScreen />} />
            </Route>
            <Route path="impostazioni" element={<SettingsScreen />} />
          </Route>
          {import.meta.env.DEV && <Route path="/dev/ui" element={<DevUIScreen />} />}
        </Routes>
        <ToastContainer />
      </GlobalErrorBoundary>
    </Router>
  );
}
