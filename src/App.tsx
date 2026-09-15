import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalErrorBoundary } from './app/ErrorBoundary';
import { Layout } from './app/Layout';
import TodayScreen from './features/today/TodayScreen';
import FinanceScreen from './features/finance/FinanceScreen';
import ProjectsScreen from './features/projects/ProjectsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';

export default function App() {
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<TodayScreen />} />
            <Route path="soldi" element={<FinanceScreen />} />
            <Route path="progetti" element={<ProjectsScreen />} />
            <Route path="impostazioni" element={<SettingsScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}
