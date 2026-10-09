import { createClient } from '@supabase/supabase-js';

/**
 * The Supabase connection.
 *
 * It lives under `src/data/` on purpose: components never import this. They go
 * through a store, the store goes through `DataAdapter`, and only an adapter
 * implementation touches a database. Putting the client in `utils/` and calling
 * `.from()` inside a screen is the shortcut that makes the data layer
 * unswappable later.
 *
 * Samar shares a Postgres instance with another app and lives in its own
 * schema, so every request has to be pointed at that schema — otherwise
 * PostgREST answers on `public`, which belongs to the other app.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** The Postgres schema that holds Samar's tables. */
export const SUPABASE_SCHEMA = import.meta.env.VITE_SUPABASE_SCHEMA ?? 'samar';

/**
 * True when the environment carries enough to talk to Supabase at all. The app
 * still runs on IndexedDB without it, so this is a capability check, not a
 * fatal condition.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey);
}

/**
 * The schema is read from the environment, so the client's type comes from the
 * call rather than from `SupabaseClient`, whose schema parameter defaults to
 * `public` and would fight us here.
 */
function create() {
  return createClient(url, publishableKey, {
    db: { schema: SUPABASE_SCHEMA },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export type SamarSupabaseClient = ReturnType<typeof create>;

let cached: SamarSupabaseClient | null = null;

/**
 * Created on first use rather than at module load, so importing anything from
 * `src/data/` does not fail in a test or a build where the env is absent.
 */
export function getSupabaseClient(): SamarSupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non è configurato: mancano VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. ' +
        'Copia .env.example in .env e riempi i valori.'
    );
  }

  cached ??= create();
  return cached;
}

export interface ConnectionCheck {
  ok: boolean;
  /** What to tell the user, in plain Italian. */
  message: string;
  schemaExposed?: boolean;
}

/**
 * Before sign-in, check that the project answers. After sign-in, query the
 * actual records table so the badge means the full data path is available.
 */
export async function checkConnection(): Promise<ConnectionCheck> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: 'Supabase non è configurato in questo ambiente.' };
  }

  try {
    const client = getSupabaseClient();
    const {
      data: { session },
    } = await client.auth.getSession();
    if (session) {
      const { error } = await client.from('records').select('record_id').limit(1);
      if (error?.code === 'PGRST106') {
        return {
          ok: false,
          schemaExposed: false,
          message: `Il progetto risponde, ma lo schema "${SUPABASE_SCHEMA}" non è esposto. Aggiungilo in Project Settings → API → Exposed schemas.`,
        };
      }
      if (error)
        return { ok: false, message: `La tabella dei dati non è disponibile (${error.code}).` };
      return {
        ok: true,
        schemaExposed: true,
        message: `Connesso. Lo schema "${SUPABASE_SCHEMA}" e la tabella dei dati rispondono.`,
      };
    }

    const response = await fetch(`${url}/rest/v1/__samar_connection_probe__?select=*&limit=1`, {
      headers: { apikey: publishableKey },
    });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, message: 'Chiave rifiutata: controlla VITE_SUPABASE_PUBLISHABLE_KEY.' };
    }
    if (response.status >= 500) {
      return {
        ok: false,
        message: `Il progetto non risponde correttamente (HTTP ${response.status}).`,
      };
    }
    return { ok: true, message: 'API raggiungibile. Accedi per verificare lo schema dei dati.' };
  } catch {
    return { ok: false, message: 'Nessuna risposta dal progetto: controlla URL e connessione.' };
  }
}
