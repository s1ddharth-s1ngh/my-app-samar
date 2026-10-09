import { create } from 'zustand';

const GLASS_KEY = 'ciclo-glass-transparency';
const THEME_KEY = 'samar-theme';

export type ThemePreference = 'light' | 'dark' | 'system';

function readTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    return 'system';
  }
  return 'system';
}

export function applyTheme(preference: ThemePreference): void {
  const dark =
    preference === 'dark' ||
    (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = dark ? 'dark' : 'light';

  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.classList.toggle('light', !dark);
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#000000' : '#f5f5f5');
}

export function applyGlassTransparency(value: number): void {
  document.documentElement.style.setProperty('--ios27-glass-transparency', String(value));
}

function readStoredTransparency(): number {
  try {
    const stored = Number(localStorage.getItem(GLASS_KEY));
    if (Number.isFinite(stored) && stored >= 0 && stored <= 1) return stored;
  } catch {
    return 0.5;
  }
  return 0.5;
}

interface ThemeState {
  theme: ThemePreference;
  setTheme: (value: ThemePreference) => void;
  glassTransparency: number;
  setGlassTransparency: (value: number) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readTheme(),
  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      return;
    }
  },
  glassTransparency: readStoredTransparency(),
  setGlassTransparency: (value) => {
    const clamped = Math.min(1, Math.max(0, value));
    set({ glassTransparency: clamped });
    applyGlassTransparency(clamped);
    try {
      localStorage.setItem(GLASS_KEY, String(clamped));
    } catch {
      return;
    }
  },
}));

if (typeof document !== 'undefined') {
  applyTheme(useThemeStore.getState().theme);
  applyGlassTransparency(useThemeStore.getState().glassTransparency);

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const updateSystemTheme = () => {
    if (useThemeStore.getState().theme === 'system') applyTheme('system');
  };
  media.addEventListener('change', updateSystemTheme);
  if (import.meta.hot) {
    import.meta.hot.dispose(() => media.removeEventListener('change', updateSystemTheme));
  }
}
