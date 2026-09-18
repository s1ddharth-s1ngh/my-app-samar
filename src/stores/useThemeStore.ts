import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'ciclo-theme';
const GLASS_KEY = 'ciclo-glass-transparency';

/**
 * Dark is the base theme: the palette is defined on `:root` and the light one
 * is opted into with a `.light` class. The iOS 27 material layer switches on
 * `data-theme` instead, so both are set from here.
 */
export function applyTheme(theme: Theme): void {
  const prefersLight =
    theme === 'light' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const root = document.documentElement;
  root.classList.toggle('light', prefersLight);
  root.dataset.theme = prefersLight ? 'light' : 'dark';
}

/**
 * iOS 27 replaced the binary Reduce Transparency toggle with a slider from
 * fully tinted to ultra clear; the material scales blur and opacity together
 * from this one number.
 */
export function applyGlassTransparency(value: number): void {
  document.documentElement.style.setProperty('--ios27-glass-transparency', String(value));
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Private mode or blocked storage: fall through to the default.
  }
  return 'dark';
}

function readStoredTransparency(): number {
  try {
    const stored = Number(localStorage.getItem(GLASS_KEY));
    if (Number.isFinite(stored) && stored >= 0 && stored <= 1) return stored;
  } catch {
    // Same as above.
  }
  return 0.5;
}

interface ThemeState {
  theme: Theme;
  glassTransparency: number;
  setTheme: (theme: Theme) => void;
  setGlassTransparency: (value: number) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readStoredTheme(),
  glassTransparency: readStoredTransparency(),

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // The theme still applies for this session even if we cannot persist it.
    }
  },

  setGlassTransparency: (value) => {
    const clamped = Math.min(1, Math.max(0, value));
    set({ glassTransparency: clamped });
    applyGlassTransparency(clamped);
    try {
      localStorage.setItem(GLASS_KEY, String(clamped));
    } catch {
      // Same as above.
    }
  },
}));

// Follow the system only while the user asked us to.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (useThemeStore.getState().theme === 'system') applyTheme('system');
  });
}

if (typeof document !== 'undefined') {
  applyGlassTransparency(useThemeStore.getState().glassTransparency);
}
