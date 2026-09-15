import { Link } from 'react-router-dom';
import { Card, Button } from '@/ui';

export default function FinanceScreen() {
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Denaro</h1>
      <p className="text-zinc-500">Gestione entrate, budget e allocazioni.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Fonti di Entrata</h2>
            <p className="text-sm text-zinc-500">Stipendio, affitti, rendite passive</p>
          </div>
          <Link to="/soldi/fonti">
            <Button variant="secondary" fullWidth>
              Gestisci Fonti
            </Button>
          </Link>
        </Card>

        <Card className="flex flex-col space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Bucket (Budget)</h2>
            <p className="text-sm text-zinc-500">Categorie di spesa e risparmio</p>
          </div>
          <Link to="/soldi/bucket">
            <Button variant="secondary" fullWidth>
              Gestisci Bucket
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
