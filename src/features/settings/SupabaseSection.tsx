import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { Button, CardHeader, Chip } from '@/ui';
import {
  SUPABASE_SCHEMA,
  checkConnection,
  isSupabaseConfigured,
  type ConnectionCheck,
} from '@/data/supabase/client';

/**
 * Says whether the app can reach Supabase, and why not when it cannot. Nothing
 * reads or writes data through it yet — the app still runs entirely on
 * IndexedDB.
 */
export function SupabaseSection() {
  const [state, setState] = useState<ConnectionCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // One probe on mount: the state lands in the promise callback, and the flag
  // guards against a result arriving after the section has gone.
  useEffect(() => {
    let cancelled = false;
    void checkConnection().then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** The manual retry is an event handler, so it may set state straight away. */
  const run = () => {
    setIsChecking(true);
    void checkConnection()
      .then(setState)
      .finally(() => setIsChecking(false));
  };

  return (
    <>
      <CardHeader
        title="Supabase"
        subtitle={
          isSupabaseConfigured()
            ? `Progetto condiviso, schema "${SUPABASE_SCHEMA}"`
            : 'Non configurato in questo ambiente'
        }
        action={
          <Button variant="quiet" onClick={run} disabled={isChecking}>
            {isChecking ? 'Verifico…' : 'Riprova'}
          </Button>
        }
      />

      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/50">
          <Database className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {state === null ? (
              <Chip>Verifico…</Chip>
            ) : state.ok ? (
              <Chip variant="good">Connesso</Chip>
            ) : state.schemaExposed === false ? (
              <Chip variant="warn">Schema non esposto</Chip>
            ) : (
              <Chip variant="bad">Non raggiungibile</Chip>
            )}
          </div>
          {state && <p className="mt-1.5 text-[11.5px] text-white/45">{state.message}</p>}
          <p className="mt-2 text-[10.5px] text-white/30">
            I dati restano su IndexedDB: nessuna tabella, nessuna migrazione.
          </p>
        </div>
      </div>
    </>
  );
}
