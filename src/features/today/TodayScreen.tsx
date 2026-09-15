import { CycleBanner } from '../cycles/CycleBanner';
import { ActiveCycleRing } from './ActiveCycleRing';
import { QuickSpendForm } from './QuickSpendForm';

export default function TodayScreen() {
  return (
    <div className="p-4 sm:p-8 space-y-8 pb-32">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Oggi</h1>
        <p className="text-zinc-500">Benvenuto in Ciclo.</p>
      </div>

      <CycleBanner />

      <ActiveCycleRing />

      <QuickSpendForm />
    </div>
  );
}
