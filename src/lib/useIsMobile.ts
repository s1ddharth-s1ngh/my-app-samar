import { useSyncExternalStore } from 'react';

/** The single breakpoint that decides which shell renders. */
export const MOBILE_QUERY = '(max-width: 767px)';

function query(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(MOBILE_QUERY);
}

function subscribe(onChange: () => void): () => void {
  const list = query();
  if (!list) return () => {};
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return query()?.matches ?? false;
}

/**
 * Reads `matchMedia` as what it is — an external store — so the first render
 * already has the right answer and no effect has to correct it afterwards.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
