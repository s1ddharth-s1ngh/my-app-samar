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
            </Route>
            <Route path="progetti" element={<ProjectsScreen />} />
            <Route path="impostazioni" element={<SettingsScreen />} />
          </Route>
          {import.meta.env.DEV && <Route path="/dev/ui" element={<DevUIScreen />} />}
        </Routes>
        <ToastContainer />
      </GlobalErrorBoundary>
    </Router>
  );
}
