import { useState } from 'react';
import { Home, Settings, Star } from 'lucide-react';
import {
  Button,
  Card,
  Chip,
  CycleRing,
  Divider,
  EmptyState,
  Field,
  IconButton,
  StatCard,
  Money,
  MoneyInput,
  PageHeader,
  TabPills,
  Select,
  Sheet,
  Toggle,
} from '@/ui';
import { useToastStore } from '@/stores/toast';

/**
 * The design system on one page, in development only. Every state a component
 * can be in should be visible here without having to reach it through the app.
 */
export function DevUIScreen() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [toggled, setToggled] = useState(false);
  const [money, setMoney] = useState<number | null>(123456);
  const [segment, setSegment] = useState('all');
  const [view, setView] = useState('list');
  const addToast = useToastStore((state) => state.addToast);

  return (
    <div className="mx-auto max-w-[1100px] space-y-10 px-4 py-8">
      <PageHeader
        title="Design system"
        subtitle="Due famiglie di raggi: pillola per l'interattivo, rounded-xl per i contenitori."
      />

      <Section title="Vetro">
        {/* A colourful ground so the material has something to refract. */}
        <div className="rounded-xl bg-gradient-to-br from-primary via-warning to-destructive p-6">
          <div className="glass glass-group mb-4 flex flex-wrap justify-center gap-2 rounded-full p-1">
            <span className="glass-item rounded-full px-4 py-2 text-sm" aria-current="page">
              In un container
            </span>
            <span className="glass-item rounded-full px-4 py-2 text-sm">Non attivo</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="glass rounded-xl px-4 py-2 text-sm">pannello</span>
            <span className="glass-control rounded-full px-4 py-2 text-sm">controllo</span>
            <span className="glass-clear rounded-xl px-4 py-2 text-sm">clear</span>
          </div>
        </div>
      </Section>

      <Section title="Bottoni">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primario</Button>
          <Button variant="quiet">Secondario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Distruttivo</Button>
          <Button disabled>Disabilitato</Button>
          <IconButton icon={Star} label="Preferito" />
          <IconButton icon={Star} label="Preferito" variant="quiet" />
          <IconButton icon={Star} label="Elimina" variant="danger" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Piccolo</Button>
          <Button size="md">Medio</Button>
          <Button size="md">Grande</Button>
        </div>
      </Section>

      <Section title="Segmented">
        <TabPills
          ariaLabel="Stato"
          value={segment}
          onChange={setSegment}
          items={[
            { id: 'all', label: 'Tutti' },
            { id: 'active', label: 'Attivi' },
            { id: 'inactive', label: 'Inattivi' },
          ]}
          className="max-w-xs"
        />
        <TabPills
          ariaLabel="Vista"
          value={view}
          onChange={setView}
          items={[
            { id: 'list', label: 'Lista' },
            { id: 'grid', label: 'Griglia' },
          ]}
          className="w-20"
        />
      </Section>

      <Section title="Campi">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Testo" placeholder="Scrivi qui" />
          <Field label="Con errore" error="Questo campo è obbligatorio" />
          <Field label="Con aiuto" helpText="Un suggerimento discreto" />
          <Field label="Disabilitato" disabled value="Non modificabile" readOnly />
          <Select
            label="Select"
            options={[
              { value: 'a', label: 'Opzione A' },
              { value: 'b', label: 'Opzione B' },
            ]}
          />
          <MoneyInput label="Importo" value={money ?? 0} onChange={setMoney} />
        </div>
        <Toggle
          label="Interruttore"
          description="Con descrizione sotto"
          checked={toggled}
          onChange={(e) => setToggled(e.target.checked)}
        />
      </Section>

      <Section title="Stati">
        <div className="flex flex-wrap items-center gap-2">
          <span className="status-chip">Inattivo</span>
          <span className="status-chip status-active">Attivo</span>
          <span className="status-chip status-warning">In attesa</span>
          <span className="status-chip status-error">Errore</span>
          <span className="status-chip status-current">Corrente</span>
          <span className="filter-chip">Filtro ereditato</span>
          <Chip variant="good">Chip</Chip>
          <Chip variant="bad" onDelete={() => addToast('Rimosso.', 'info')}>
            Rimovibile
          </Chip>
        </div>
      </Section>

      <Section title="Metriche">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="Neutro" value={<Money cents={123456} compact />} icon={Home} />
          <StatCard label="Corrente" value={<Money cents={98000} compact />} tone="brand" />
          <StatCard
            label="Con barra"
            value={<Money cents={45000} compact />}
            progress={0.62}
            tone="good"
          />
          <StatCard
            label="Scoperto"
            value={<Money cents={-12000} compact />}
            tone="bad"
            hint="Sei oltre il budget"
          />
        </div>
      </Section>

      <Section title="Anello del ciclo">
        <Card className="flex justify-center">
          <CycleRing
            daysTotal={30}
            daysPassed={12}
            totalBudget={200000}
            buckets={[
              { id: '1', amount: 90000, color: '#9db560' },
              { id: '2', amount: 60000, color: '#d97706' },
              { id: '3', amount: 50000, color: '#059669' },
            ]}
          />
        </Card>
      </Section>

      <Section title="Contenitori">
        <div className="grid gap-3 md:grid-cols-2">
          <Card>Card standard</Card>
          <Card className="cursor-pointer transition-colors hover:bg-white/[0.03]">
            Card cliccabile
          </Card>
        </div>
        <Divider />
        <EmptyState
          icon={Settings}
          title="Nessun elemento trovato"
          description="Prova a modificare i filtri di ricerca."
          actions={<Button onClick={() => setIsSheetOpen(true)}>Apri lo sheet</Button>}
        />
      </Section>

      <Section title="Notifiche">
        <div className="flex flex-wrap gap-3">
          <Button variant="quiet" onClick={() => addToast('Salvato.', 'success')}>
            Successo
          </Button>
          <Button variant="quiet" onClick={() => addToast('Informazione.', 'info')}>
            Info
          </Button>
          <Button variant="quiet" onClick={() => addToast('Qualcosa è andato storto.', 'error')}>
            Errore
          </Button>
        </div>
      </Section>

      <Sheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Uno sheet">
        <div className="space-y-4 py-2">
          <p className="text-sm text-white/45">
            Sul telefono sale dal basso, da tablet in su è una modale centrata.
          </p>
          <Field label="Un campo" placeholder="Scrivi qui" />
          <Button fullWidth onClick={() => setIsSheetOpen(false)}>
            Chiudi
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="kpi-label">{title}</h2>
      {children}
    </section>
  );
}
