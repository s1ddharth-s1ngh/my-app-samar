import '@testing-library/jest-dom/vitest';
// jsdom ships no IndexedDB, and the store hydrates from it on boot.
import 'fake-indexeddb/auto';
import { vi } from 'vitest';

/**
 * jsdom ships no `matchMedia`. Tests default to the desktop shell; a test that
 * needs the phone one calls `setViewportMatches` below.
 */
let mediaMatches = false;
const listeners = new Set<() => void>();

export function setViewportMatches(matches: boolean): void {
  mediaMatches = matches;
  listeners.forEach((listener) => listener());
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((media: string) => ({
    media,
    get matches() {
      return mediaMatches;
    },
    onchange: null,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    addListener: (listener: () => void) => listeners.add(listener),
    removeListener: (listener: () => void) => listeners.delete(listener),
    dispatchEvent: () => false,
  })),
});
