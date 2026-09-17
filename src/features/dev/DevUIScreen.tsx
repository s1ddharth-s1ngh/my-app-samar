import { useState } from 'react';
import {
  Button,
  IconButton,
  Field,
  Select,
  Toggle,
  Chip,
  Card,
  Divider,
  EmptyState,
  Sheet,
  Money,
  MoneyInput,
  CycleRing,
} from '@/ui';
import { Star, Home, Settings } from 'lucide-react';
import { useToastStore } from '@/stores/toast';

export function DevUIScreen() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [toggleState, setToggleState] = useState(false);
  const [moneyValue, setMoneyValue] = useState<number | null>(123456);
  const addToast = useToastStore((state) => state.addToast);

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-12 pb-32">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Design System</h1>
        <p className="text-zinc-500">Preview di tutti i componenti UI (Responsive)</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Liquid Glass</h2>
        <p className="text-sm text-ink-muted">
          Il vetro sta solo sul livello di navigazione: barre, sheet, toast, controlli. Mai sul
          contenuto. Lo sfondo colorato qui sotto serve a far vedere cosa filtra.
        </p>
        <div className="rounded-2xl p-6 bg-gradient-to-br from-accent via-signal to-alert">
          <div className="glass-group glass rounded-[28px] p-4 flex flex-wrap gap-3 justify-center">
            <span className="glass-item rounded-2xl px-4 py-2 text-sm">In un container</span>
            <span className="glass-item glass-tint-accent rounded-2xl px-4 py-2 text-sm">
              Con tinta
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <span className="glass rounded-2xl px-4 py-2 text-sm text-ink">regular</span>
            <span className="glass glass-clear rounded-2xl px-4 py-2 text-sm text-ink">clear</span>
            <span className="glass glass-interactive rounded-2xl px-4 py-2 text-sm text-ink">
              interactive
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <Button variant="glass">Vetro</Button>
            <Button variant="glassProminent">Vetro in evidenza</Button>
            <IconButton icon={Star} label="Preferito" variant="glass" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Anello del Ciclo (CycleRing)</h2>
        <div className="flex justify-center p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <CycleRing
            daysTotal={30}
            daysPassed={12}
            totalBudget={200000}
            buckets={[
              { id: '1', amount: 80000, color: '#ef4444' }, // red
              { id: '2', amount: 40000, color: '#eab308' }, // yellow
              { id: '3', amount: 60000, color: '#22c55e' }, // green
            ]}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Denaro (Money & MoneyInput)</h2>
        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex gap-4 items-center p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500">Base</span>
              <Money cents={123456} className="text-lg font-medium" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500">Con Segno</span>
              <Money cents={123456} showSign className="text-lg font-medium" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500">Semantico (+)</span>
              <Money cents={123456} semanticColor showSign className="text-lg font-bold" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500">Semantico (-)</span>
              <Money cents={-5000} semanticColor showSign className="text-lg font-bold" />
            </div>
          </div>

          <MoneyInput
            label="Inserisci importo"
            value={moneyValue ?? 0}
            onChange={setMoneyValue}
            helpText={`Valore nello stato: ${moneyValue} centesimi`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="md">
            Medium
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
        </div>
        <div>
          <Button variant="secondary" fullWidth>
            Full Width Button
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Icon Buttons</h2>
        <div className="flex gap-4 items-center">
          <IconButton icon={Home} label="Home" variant="primary" />
          <IconButton icon={Star} label="Star" variant="secondary" />
          <IconButton icon={Settings} label="Settings" variant="ghost" />
          <IconButton icon={Star} label="Destructive" variant="destructive" />
          <IconButton icon={Home} label="Disabled" variant="primary" disabled />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Fields & Forms</h2>
        <div className="max-w-md space-y-4">
          <Field
            label="Normal Input"
            placeholder="Inserisci testo..."
            helpText="Testo di aiuto sotto il campo"
          />
          <Field
            label="Error Input"
            defaultValue="Testo sbagliato"
            error="Questo campo è obbligatorio"
          />
          <Field label="Disabled Input" disabled defaultValue="Non modificabile" />

          <Select
            label="Select Dropdown"
            options={[
              { value: '1', label: 'Opzione 1' },
              { value: '2', label: 'Opzione 2' },
            ]}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Toggles</h2>
        <div className="max-w-md space-y-4">
          <Toggle
            label="Abilita notifiche"
            description="Riceverai una notifica al giorno"
            checked={toggleState}
            onChange={(e) => setToggleState(e.target.checked)}
          />
          <Toggle label="Toggle disabilitato" disabled checked={true} readOnly />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Chips</h2>
        <div className="flex flex-wrap gap-2">
          <Chip variant="neutral">Neutral</Chip>
          <Chip variant="primary">Primary</Chip>
          <Chip variant="success">Success</Chip>
          <Chip variant="warning">Warning</Chip>
          <Chip variant="error">Error</Chip>
          <Chip variant="neutral" onDelete={() => alert('deleted')}>
            Con elimina
          </Chip>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Card</h2>
        <Card>
          <h3 className="font-bold text-lg mb-2">Titolo Card</h3>
          <p className="text-zinc-500">
            Contenuto interno della card. La card ha padding e shadow. È responsive.
          </p>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Divider</h2>
        <p>Sopra</p>
        <Divider />
        <p>Sotto</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Empty State</h2>
        <Card padding="none">
          <EmptyState
            icon={Star}
            title="Nessun dato presente"
            description="Non hai ancora inserito nessun elemento. Inizia creandone uno nuovo."
            action={<Button>Crea nuovo</Button>}
          />
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Overlays (Toast & Sheet)</h2>
        <div className="flex gap-4">
          <Button onClick={() => addToast('Operazione completata con successo!', 'info')}>
            Mostra Toast Info
          </Button>
          <Button
            variant="destructive"
            onClick={() => addToast('Si è verificato un errore critico.', 'error')}
          >
            Mostra Toast Error
          </Button>
          <Button variant="secondary" onClick={() => setIsSheetOpen(true)}>
            Apri Sheet / Dialog
          </Button>
        </div>
      </section>

      <Sheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Modifica Dati">
        <div className="space-y-4 py-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            Questo componente si comporta come una Bottom Sheet su mobile e come una Dialog modale
            centrata su schermi desktop (sm:).
          </p>
          <Field label="Nome" placeholder="Inserisci il tuo nome" />
          <Field label="Cognome" placeholder="Inserisci il tuo cognome" />
          <div className="flex gap-2 pt-4">
            <Button className="flex-1">Salva</Button>
            <Button variant="secondary" onClick={() => setIsSheetOpen(false)}>
              Annulla
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
