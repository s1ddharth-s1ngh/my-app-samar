import { useState } from 'react';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { Button, Card, Select, MoneyInput, Field } from '@/ui';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Bucket, AllocationRule } from '@/data/types';

export function AllocationRulesScreen() {
  const buckets = useDataStore((state) => state.buckets).sort((a, b) => a.priority - b.priority);
  const updateItem = useDataStore((state) => state.updateItem);
  const addToast = useToastStore((state) => state.addToast);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRule, setDraftRule] = useState<AllocationRule | null>(null);

  const handleEdit = (bucket: Bucket) => {
    setEditingId(bucket.id);
    setDraftRule(bucket.rule);
  };

  const handleSave = async (id: string) => {
    if (!draftRule) return;
    try {
      await updateItem('buckets', id, { rule: draftRule });
      setEditingId(null);
      addToast('Regola aggiornata.', 'success');
    } catch {
      // toast handled
    }
  };

  // Validation logic
  let totalPercent = 0;
  let hasRemainder = false;

  buckets.forEach((b) => {
    const rule = editingId === b.id && draftRule ? draftRule : b.rule;
    if (rule.type === 'percent') totalPercent += rule.value;
    if (rule.type === 'remainder') hasRemainder = true;
  });

  let validationAlert: React.ReactNode;
  if (totalPercent > 100) {
    validationAlert = (
      <div className="flex items-start gap-3 p-4 bg-red-50 text-red-900 rounded-xl">
        <AlertCircle className="mt-0.5 shrink-0" size={20} />
        <p className="text-sm font-medium">
          La somma delle percentuali ({totalPercent}%) supera il 100%.
        </p>
      </div>
    );
  } else if (!hasRemainder && totalPercent < 100) {
    validationAlert = (
      <div className="flex items-start gap-3 p-4 bg-yellow-50 text-yellow-900 rounded-xl">
        <AlertCircle className="mt-0.5 shrink-0" size={20} />
        <p className="text-sm font-medium">
          Non hai un bucket per il "resto", e le percentuali non coprono il 100%. I fondi in eccesso
          rimarranno non allocati.
        </p>
      </div>
    );
  } else {
    validationAlert = (
      <div className="flex items-center gap-3 p-4 bg-green-50 text-green-900 rounded-xl">
        <CheckCircle2 className="shrink-0" size={20} />
        <p className="text-sm font-medium">
          Configurazione valida. I fondi fluiranno correttamente.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Regole di Allocazione</h1>
        <p className="text-sm text-zinc-500">
          Quando ricevi un'entrata (es. Stipendio), i soldi scendono a cascata nei bucket in base
          all'ordine e a queste regole.
        </p>
      </div>

      {validationAlert}

      <div className="space-y-4">
        {buckets.map((bucket, index) => {
          const isEditing = editingId === bucket.id;
          const rule = isEditing && draftRule ? draftRule : bucket.rule;

          return (
            <Card key={bucket.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 w-48 shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-zinc-100 text-zinc-500">
                  {index + 1}
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${bucket.color}20`, color: bucket.color }}
                >
                  {bucket.icon}
                </div>
                <div>
                  <h3 className="font-semibold line-clamp-1">{bucket.name}</h3>
                </div>
              </div>

              {isEditing ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-3 items-end">
                  <Select
                    label="Regola"
                    value={draftRule?.type || 'remainder'}
                    onChange={(e) => {
                      const type = e.target.value as any;
                      if (type === 'fixed') setDraftRule({ type: 'fixed', value: 0 });
                      else if (type === 'percent')
                        setDraftRule({ type: 'percent', value: 10, base: 'afterFixed' });
                      else setDraftRule({ type: 'remainder' });
                    }}
                    options={[
                      { value: 'fixed', label: 'Importo Fisso' },
                      { value: 'percent', label: 'Percentuale' },
                      { value: 'remainder', label: 'Tutto il resto' },
                    ]}
                  />

                  {draftRule?.type === 'fixed' && (
                    <MoneyInput
                      label="Importo"
                      value={draftRule.value}
                      onChange={(v) => setDraftRule({ type: 'fixed', value: v || 0 })}
                    />
                  )}

                  {draftRule?.type === 'percent' && (
                    <>
                      <Field
                        label="% (0-100)"
                        type="number"
                        min={0}
                        max={100}
                        value={draftRule.value}
                        onChange={(e) =>
                          setDraftRule({ ...draftRule, value: parseInt(e.target.value) || 0 })
                        }
                      />
                      <Select
                        label="Su quale base"
                        value={draftRule.base}
                        onChange={(e) =>
                          setDraftRule({ ...draftRule, base: e.target.value as any })
                        }
                        options={[
                          { value: 'afterFixed', label: 'Rimasto' },
                          { value: 'gross', label: 'Totale Iniziale' },
                        ]}
                      />
                    </>
                  )}

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={() => handleSave(bucket.id)} className="flex-1">
                      Salva
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditingId(null)}
                      className="flex-1"
                    >
                      Chiudi
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg">
                  <div className="text-sm font-medium">
                    {rule.type === 'fixed' &&
                      `Importo fisso: ${(rule.value / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}`}
                    {rule.type === 'percent' &&
                      `${rule.value}% del ${rule.base === 'gross' ? 'totale' : 'rimanente'}`}
                    {rule.type === 'remainder' && 'Tutto il resto'}
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(bucket)}>
                    Modifica
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
