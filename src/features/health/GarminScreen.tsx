import { useCallback, useEffect, useState } from 'react';
import { Activity, BatteryCharging, Flame, Footprints, HeartPulse, Watch } from 'lucide-react';
import { Button, Card, CardHeader, Chip, EmptyState, PageHeader, StatCard } from '@/ui';
import { garmin } from '@/data/supabase/garmin';
import { isSupabaseConfigured } from '@/data/supabase/client';
import { todayCalendarDate } from '@/domain/cycles';
import { shiftDate } from '@/domain/schedule';
import { useCloudStore } from '@/stores/cloud';

interface DaySteps {
  calendarDate: string;
  totalSteps: number | null;
  stepGoal: number | null;
}
interface DailySummary {
  totalSteps: number | null;
  dailyStepGoal: number | null;
  totalKilocalories: number | null;
  activeKilocalories: number | null;
}
interface Hrv {
  hrvSummary?: { status?: string; weeklyAvg?: number | null; lastNightAvg?: number | null };
}
interface BodyBattery {
  date: string;
  charged: number | null;
  drained: number | null;
}
interface GarminActivity {
  activityId: number;
  activityName: string;
  startTimeLocal: string;
  distance?: number;
  duration?: number;
}

interface GarminData {
  summary: DailySummary;
  steps: DaySteps[];
  hrv: Hrv | null;
  battery: BodyBattery[];
  activities: GarminActivity[];
}

const HRV_TONE: Record<string, 'good' | 'warn' | 'bad'> = {
  BALANCED: 'good',
  UNBALANCED: 'warn',
  LOW: 'bad',
  POOR: 'bad',
};

const number = (value: number | null | undefined) =>
  value == null ? '—' : value.toLocaleString('it-IT');

function duration(seconds = 0) {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
}

async function load(): Promise<GarminData> {
  const today = todayCalendarDate();
  const weekAgo = shiftDate(today, -6);
  const [summary, steps, hrv, battery, activities] = await Promise.all([
    garmin<DailySummary>(`/usersummary-service/usersummary/daily?calendarDate=${today}`),
    garmin<DaySteps[]>(`/usersummary-service/stats/steps/daily/${weekAgo}/${today}`),
    // HRV only exists after a night with the watch on.
    garmin<Hrv>(`/hrv-service/hrv/${today}`).catch(() => null),
    garmin<BodyBattery[]>(
      `/wellness-service/wellness/bodyBattery/reports/daily?startDate=${today}&endDate=${today}`
    ),
    garmin<GarminActivity[]>('/activitylist-service/activities/search/activities?limit=5'),
  ]);
  return { summary, steps, hrv, battery, activities };
}

export function GarminScreen() {
  const signedIn = useCloudStore((state) => Boolean(state.userId));
  const [data, setData] = useState<GarminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /** State lands only in the promise callbacks, so the effect can share it. */
  const fetchInto = useCallback((isLive: () => boolean = () => true) => {
    load()
      .then((result) => {
        if (!isLive()) return;
        setData(result);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (isLive()) setError(reason instanceof Error ? reason.message : 'Garmin non risponde.');
      })
      .finally(() => isLive() && setLoading(false));
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    fetchInto(() => live);
    return () => {
      live = false;
    };
  }, [signedIn, fetchInto]);

  const refresh = () => {
    setLoading(true);
    fetchInto();
  };

  if (!isSupabaseConfigured() || !signedIn) {
    return (
      <div className="space-y-3">
        <PageHeader title="Garmin" subtitle="Passi, energia e attività dal tuo orologio." />
        <EmptyState
          icon={Watch}
          title="Accedi per vedere i dati Garmin"
          description="La chiave Garmin resta su Supabase: entra con il tuo account da Impostazioni."
        />
      </div>
    );
  }

  const { summary, steps, hrv, battery, activities } = data ?? {};
  const hrvStatus = hrv?.hrvSummary?.status;
  const today = battery?.[0];

  return (
    <div className="space-y-3">
      <PageHeader
        title="Garmin"
        subtitle="Passi, energia e attività dal tuo orologio."
        actions={
          <Button variant="quiet" onClick={refresh} disabled={loading}>
            {loading ? 'Aggiorno…' : 'Aggiorna'}
          </Button>
        }
      />

      {error && (
        <Card>
          <p className="text-[12px] text-bad">{error}</p>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Passi oggi"
              value={number(summary?.totalSteps)}
              hint={`Obiettivo ${number(summary?.dailyStepGoal)}`}
              icon={Footprints}
              progress={
                summary?.totalSteps != null && summary.dailyStepGoal
                  ? summary.totalSteps / summary.dailyStepGoal
                  : undefined
              }
              tone="brand"
            />
            <StatCard
              label="Calorie"
              value={number(summary?.totalKilocalories)}
              hint={`${number(summary?.activeKilocalories)} attive`}
              icon={Flame}
            />
            <StatCard
              label="Body Battery"
              value={today ? `+${today.charged ?? 0} / −${today.drained ?? 0}` : '—'}
              hint="Ricaricata / consumata oggi"
              icon={BatteryCharging}
            />
            <StatCard
              label="HRV"
              value={number(hrv?.hrvSummary?.weeklyAvg)}
              hint="Media settimanale (ms)"
              icon={HeartPulse}
              tone={hrvStatus ? (HRV_TONE[hrvStatus] ?? 'neutral') : 'neutral'}
            />
          </div>

          <Card>
            <CardHeader
              title="Ultimi 7 giorni"
              subtitle="Passi rispetto all’obiettivo del giorno"
            />
            <ul className="divide-y divide-border">
              {steps?.map((day) => {
                const reached = (day.totalSteps ?? 0) >= (day.stepGoal ?? Infinity);
                return (
                  <li key={day.calendarDate} className="flex items-center justify-between py-2">
                    <span className="text-[12.5px]">
                      {new Date(`${day.calendarDate}T12:00:00`).toLocaleDateString('it-IT', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span className="flex items-center gap-2 text-[12.5px]" data-numeric="">
                      {number(day.totalSteps)}
                      <Chip variant={reached ? 'good' : 'neutral'}>
                        {reached ? 'Obiettivo' : `/ ${number(day.stepGoal)}`}
                      </Chip>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Attività recenti" />
            {activities?.length ? (
              <ul className="divide-y divide-border">
                {activities.map((activity) => (
                  <li key={activity.activityId} className="flex items-center gap-3 py-2">
                    <Activity
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{activity.activityName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {activity.startTimeLocal.slice(0, 16)}
                      </p>
                    </div>
                    <span
                      className="text-right text-[11.5px] text-muted-foreground"
                      data-numeric=""
                    >
                      {activity.distance ? `${(activity.distance / 1000).toFixed(1)} km · ` : ''}
                      {duration(activity.duration)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-muted-foreground">Nessuna attività registrata.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
