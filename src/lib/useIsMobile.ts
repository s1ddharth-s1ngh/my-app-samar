import { useCallback, useSyncExternalStore } from 'react';

/** The single breakpoint that decides which shell renders. */
export const MOBILE_QUERY = '(max-width: 767px)';

function query(mediaQuery: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(mediaQuery);
}

function subscribe(mediaQuery: string, onChange: () => void): () => void {
  const list = query(mediaQuery);
  if (!list) return () => {};
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

export function useMediaQuery(mediaQuery: string): boolean {
  const subscribeQuery = useCallback(
    (onChange: () => void) => subscribe(mediaQuery, onChange),
    [mediaQuery]
  );
  const getSnapshot = useCallback(() => query(mediaQuery)?.matches ?? false, [mediaQuery]);
  return useSyncExternalStore(subscribeQuery, getSnapshot, () => false);
}

/**
 * Reads `matchMedia` as what it is — an external store — so the first render
 * already has the right answer and no effect has to correct it afterwards.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
