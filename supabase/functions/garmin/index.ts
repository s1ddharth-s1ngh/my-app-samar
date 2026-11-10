// Read-only proxy to the Garmin Connect Personal API.
//
//   POST {path: '/usersummary-service/...'}  Authorization: Bearer <session>  → Garmin's JSON
//
// The personal API key lives only in this function's secrets (GARMIN_API_KEY):
// it reads the owner's health data, so the browser never sees it. The project
// is shared with another app, so a valid session is not enough: only the
// account whose email is GARMIN_OWNER_EMAIL gets through.
// Deployed with verify_jwt = false; the caller is checked below.

const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret ${name}`);
  return value;
};

const GARMIN = 'https://personal.connectapi.garmin.com';

/** The services listed in Garmin's Personal API swagger. Anything else is refused. */
const SERVICES = [
  'activity-service',
  'activitylist-service',
  'biometric-service',
  'fitnessage-service',
  'goal-service',
  'hrv-service',
  'nutrition-service',
  'periodichealth-service',
  'sleep-service',
  'userprofile-service',
  'usersummary-service',
  'weight-service',
  'wellness-service',
  'wellnessactivity-service',
];

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });

/** Garmin's access token lasts a day: kept while this instance lives. */
let cached: { token: string; until: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.until > Date.now()) return cached.token;
  const response = await fetch(
    `${GARMIN}/personalapitoken-service/personal-api/personal-api-key/token`,
    { method: 'POST', headers: { authorization: `ApiKey ${env('GARMIN_API_KEY')}` } }
  );
  if (!response.ok) throw new Error(`Garmin ha rifiutato la chiave (HTTP ${response.status}).`);
  const token = (await response.text()).trim();
  const { exp } = JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')));
  cached = { token, until: exp * 1000 - 5 * 60_000 };
  return token;
}

async function ownerEmail(request: Request): Promise<string | null> {
  const response = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, {
    headers: {
      authorization: request.headers.get('authorization') ?? '',
      apikey: env('SUPABASE_ANON_KEY'),
    },
  });
  if (!response.ok) return null;
  return ((await response.json()).email as string | undefined)?.toLowerCase() ?? null;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Metodo non ammesso.' }, 405);

  if ((await ownerEmail(request)) !== env('GARMIN_OWNER_EMAIL').toLowerCase())
    return json({ error: 'Accedi con l’account proprietario di Garmin.' }, 403);

  const { path } = await request.json().catch(() => ({}));
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.includes('..') ||
    !SERVICES.includes(path.split('/')[1] ?? '')
  )
    return json({ error: 'Percorso non ammesso.' }, 400);

  try {
    let response = await fetch(GARMIN + path, {
      headers: { authorization: `Bearer ${await accessToken()}` },
    });
    if (response.status === 401) {
      // Revoked or rotated early: one fresh token, then give up.
      cached = null;
      response = await fetch(GARMIN + path, {
        headers: { authorization: `Bearer ${await accessToken()}` },
      });
    }
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...cors,
        'content-type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Garmin non risponde.' }, 502);
  }
});
