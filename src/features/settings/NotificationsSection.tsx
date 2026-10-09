import { Capacitor } from '@capacitor/core';
import { useDataStore } from '@/stores/useDataStore';
import { useToastStore } from '@/stores/toast';
import { CardHeader, Toggle } from '@/ui';
import { planNotifications, requestReminderPermission } from '@/lib/notifier';
import { nowInstant } from '@/lib/record';

export function NotificationsSection() {
  const settings = useDataStore((state) => state.settings);
  const tasks = useDataStore((state) => state.tasks);
  const updateSettings = useDataStore((state) => state.updateSettings);
  const addToast = useToastStore((state) => state.addToast);

  const enabled = settings?.notificationsEnabled ?? false;
  const planned = enabled ? planNotifications(tasks).length : 0;

  const handleToggle = async (next: boolean) => {
    if (!settings) return;

    // The click is what lets us ask: both Safari and Android refuse a prompt
    // that no gesture asked for.
    if (next && !(await requestReminderPermission())) {
      addToast('Il permesso per le notifiche è stato negato.', 'error');
      return;
    }

    try {
      await updateSettings({ ...settings, notificationsEnabled: next, updatedAt: nowInstant() });
    } catch {
      // The store already reported the failure.
    }
  };

  return (
    <>
      <CardHeader
        title="Promemoria"
        subtitle={
          Capacitor.isNativePlatform()
            ? "Arrivano anche con l'app chiusa."
            : 'Nel browser arrivano solo con una scheda aperta. Installa l’app Android per riceverli sempre.'
        }
      />
      <Toggle
        label="Promemoria degli obiettivi"
        description={
          enabled
            ? `${planned} in programma nei prossimi 60 giorni.`
            : 'Spenti: nessun obiettivo ti scriverà.'
        }
        checked={enabled}
        onChange={(e) => void handleToggle(e.target.checked)}
      />
    </>
  );
}
