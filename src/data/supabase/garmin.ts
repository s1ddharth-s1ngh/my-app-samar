import { getSupabaseClient } from './client';

/**
 * One GET against Garmin's Personal API, through the `garmin` Edge Function:
 * the API key stays in the function's secrets, never in the app.
 */
export async function garmin<T>(path: string): Promise<T> {
  const { data, error } = await getSupabaseClient().functions.invoke('garmin', {
    body: { path },
  });
  if (error) {
    // FunctionsHttpError carries the function's own JSON message in `context`.
    const body = await (error.context as Response | undefined)?.json?.().catch(() => null);
    throw new Error(body?.error ?? error.message);
  }
  return data as T;
}
