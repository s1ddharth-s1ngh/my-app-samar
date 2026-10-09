import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { Button, CardHeader, Chip, Field } from '@/ui';
import {
  SUPABASE_SCHEMA,
  checkConnection,
  getSupabaseClient,
  isSupabaseConfigured,
  type ConnectionCheck,
} from '@/data/supabase/client';
import { requestCloudSync, useCloudStore } from '@/stores/cloud';

/**
 * Account and sync controls. IndexedDB remains the offline copy.
 */
export function SupabaseSection() {
  const [state, setState] = useState<ConnectionCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [email, setEmail] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const cloud = useCloudStore();

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
  }, [cloud.userId]);

  /** The manual retry is an event handler, so it may set state straight away. */
  const run = () => {
    setIsChecking(true);
    void checkConnection()
      .then(setState)
      .finally(() => setIsChecking(false));
  };

  const sendAccessLink = async () => {
    if (!email.trim()) return;
    setIsSending(true);
    setAuthMessage(null);
    try {
      const { error } = await getSupabaseClient().auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setAuthMessage('Ti abbiamo inviato un link di accesso. Aprilo su questo dispositivo.');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Invio non riuscito. Riprova.');
    } finally {
      setIsSending(false);
    }
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
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06] text-muted-foreground">
          <Database className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {state === null ? (
              <Chip>Verifico…</Chip>
            ) : state.ok ? (
              <Chip variant="good">
                {state.schemaExposed ? 'Dati connessi' : 'API raggiungibile'}
              </Chip>
            ) : state.schemaExposed === false ? (
              <Chip variant="warn">Schema non esposto</Chip>
            ) : (
              <Chip variant="bad">Non raggiungibile</Chip>
            )}
          </div>
          {state && <p className="mt-1.5 text-[11.5px] text-muted-foreground">{state.message}</p>}
          {cloud.userId ? (
            <div className="mt-3 space-y-2">
              <p className="text-[11.5px] text-foreground/70">
                Account: {cloud.email ?? 'connesso'}
              </p>
              <div className="flex items-center gap-2">
                <Chip
                  variant={
                    cloud.status === 'synced'
                      ? 'good'
                      : cloud.status === 'error'
                        ? 'bad'
                        : 'neutral'
                  }
                >
                  {cloud.status === 'syncing'
                    ? 'Sincronizzo…'
                    : cloud.status === 'synced'
                      ? 'Dati sincronizzati'
                      : cloud.status === 'error'
                        ? 'Errore di sincronizzazione'
                        : 'In attesa'}
                </Chip>
                <Button variant="quiet" onClick={requestCloudSync}>
                  Sincronizza ora
                </Button>
              </div>
              {cloud.message && <p className="text-[11px] text-bad">{cloud.message}</p>}
              <Button variant="ghost" onClick={() => void getSupabaseClient().auth.signOut()}>
                Esci dall’account
              </Button>
            </div>
          ) : isSupabaseConfigured() ? (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-muted-foreground">
                Accedi per salvare i dati nel cloud e ritrovarli sugli altri dispositivi.
              </p>
              <Field
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button disabled={isSending || !email.trim()} onClick={() => void sendAccessLink()}>
                {isSending ? 'Invio…' : 'Invia link di accesso'}
              </Button>
              {authMessage && <p className="text-[11px] text-muted-foreground">{authMessage}</p>}
            </div>
          ) : null}
          <p className="mt-2 text-[10.5px] text-muted-foreground">
            Una copia dei dati resta in questo browser per l’uso senza rete.
          </p>
        </div>
      </div>
    </>
  );
}
