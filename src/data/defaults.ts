import { newBase } from '@/lib/record';
import type { Settings } from './types';

/** Settings the app falls back to before the user has saved anything. */
export function defaultSettings(): Settings {
  return {
    ...newBase(),
    currency: 'EUR',
    locale: 'it-IT',
    weekStartsOn: 1,
    cycleMode: 'calendarMonth',
    paydayAnchor: 27,
    theme: 'dark',
    notificationsEnabled: false,
    quietHours: null,
  };
}
