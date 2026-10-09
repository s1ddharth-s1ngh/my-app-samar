import type { Settings, Task } from '@/data/types';
import { formatCalendarDate } from '@/domain/cycles';
import { daysToDeadline, deadlineLabel, isGoal, isGoalOpen, reminderTimes } from '@/domain/goals';

/**
 * Turning goals into notifications that actually ring.
 *
 * The plan is never stored: it is recomputed from the goals every time one
 * changes and every time the app comes back to the front, then handed to the
 * platform. Nothing to keep in sync, nothing to go stale.
 *
 *   Android (Capacitor)  real alarms. They ring with the app closed, offline.
 *   Web                  a timer inside the page. It rings only while a tab is
 *                        open: the browser has no way to schedule anything a
 *                        closed page would fire.
 */

/** How far ahead alarms are programmed. Refilled whenever the app is opened. */
const HORIZON_DAYS = 60;

/** Android keeps a few hundred pending alarms at most; stay well under. */
const MAX_PENDING = 60;

/** `setTimeout` overflows past ~24.8 days and fires at once. */
const MAX_TIMEOUT = 2_147_483_647;

export interface PlannedNotification {
  id: number;
  title: string;
  body: string;
  at: Date;
  path: string;
}

/** Same goal plus same instant gives the same id, so a resync is idempotent. */
function notificationId(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % 2_147_483_647;
}

/** Every notification the open goals want, soonest first. */
export function planNotifications(tasks: Task[], from: Date = new Date()): PlannedNotification[] {
  return tasks
    .filter((task) => isGoal(task) && isGoalOpen(task))
    .flatMap((task) =>
      reminderTimes(task, from, HORIZON_DAYS).map((time) => ({
        id: notificationId(`${task.id}:${time.at.getTime()}`),
        title: task.title,
        // Read on the day it rings, so the countdown is from then, not today.
        body: `Scade ${deadlineLabel(daysToDeadline(task, formatCalendarDate(time.at)) ?? 0)}.`,
        at: time.at,
        path: '/obiettivi',
      }))
    )
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_PENDING);
}

type NativeApi = typeof import('@capacitor/local-notifications').LocalNotifications;

/** The plugin, or null on the web. Imported lazily: the browser never needs it. */
async function nativeApi(): Promise<NativeApi | null> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return null;

    const { LocalNotifications } = await import('@capacitor/local-notifications');
    return LocalNotifications;
  } catch {
    return null;
  }
}

/**
 * Ask for permission. Must be called from a real click: Safari and Android
 * both refuse a prompt that no gesture asked for.
 */
export async function requestReminderPermission(): Promise<boolean> {
  const api = await nativeApi();
  if (api) return (await api.requestPermissions()).display === 'granted';

  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  return (await Notification.requestPermission()) === 'granted';
}

let webPlan: PlannedNotification[] = [];
let webTimer: number | undefined;

function armWeb(): void {
  if (webTimer !== undefined) clearTimeout(webTimer);
  webTimer = undefined;

  const next = webPlan[0];
  if (!next) return;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const delay = next.at.getTime() - Date.now();
  if (delay > MAX_TIMEOUT) return;

  webTimer = window.setTimeout(
    () => {
      new Notification(next.title, { body: next.body, tag: String(next.id) });
      webPlan = webPlan.slice(1);
      armWeb();
    },
    Math.max(0, delay)
  );
}

// ponytail: cancel everything and reprogram the lot on each change. Diff the
// pending list against the plan if 60 alarms ever becomes slow enough to feel.
async function scheduleNative(api: NativeApi, planned: PlannedNotification[]): Promise<void> {
  const { notifications } = await api.getPending();
  if (notifications.length > 0) await api.cancel({ notifications });
  if (planned.length === 0) return;

  if ((await api.checkPermissions()).display !== 'granted') return;

  await api.schedule({
    notifications: planned.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      schedule: { at: notification.at, allowWhileIdle: true },
      extra: { path: notification.path },
    })),
  });
}

/** Bring the platform in line with the goals as they are right now. */
export async function syncReminders(tasks: Task[], settings: Settings | null): Promise<void> {
  const planned = settings?.notificationsEnabled ? planNotifications(tasks) : [];
  const api = await nativeApi();

  if (api) {
    await scheduleNative(api, planned);
    return;
  }

  webPlan = planned;
  armWeb();
}
