import { create } from 'zustand';

const GLASS_KEY = 'ciclo-glass-transparency';

/**
 * iOS 27 replaced the binary Reduce Transparency toggle with a slider from
 * fully tinted to ultra clear; the material scales blur and opacity together
 * from this one number.
 *
 * There is no light theme: the app is modelled on a system that is dark only.
 */
export function applyGlassTransparency(value: number): void {
  document.documentElement.style.setProperty('--ios27-glass-transparency', String(value));
}

function readStoredTransparency(): number {
  try {
    const stored = Number(localStorage.getItem(GLASS_KEY));
    if (Number.isFinite(stored) && stored >= 0 && stored <= 1) return stored;
  } catch {
    // Private mode or blocked storage: fall back to the default.
  }
  return 0.5;
}

interface ThemeState {
  glassTransparency: number;
  setGlassTransparency: (value: number) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  glassTransparency: readStoredTransparency(),

  setGlassTransparency: (value) => {
    const clamped = Math.min(1, Math.max(0, value));
    set({ glassTransparency: clamped });
    applyGlassTransparency(clamped);
    try {
      localStorage.setItem(GLASS_KEY, String(clamped));
    } catch {
      // The choice still applies for this session.
    }
  },
}));

if (typeof document !== 'undefined') {
  applyGlassTransparency(useThemeStore.getState().glassTransparency);
}
