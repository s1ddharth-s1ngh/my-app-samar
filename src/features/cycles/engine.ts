import type { Cycle, Settings, CalendarDate } from '@/data/types';

/**
 * Returns the current local date in YYYY-MM-DD format
 */
export function getTodayDate(): CalendarDate {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD to a Date object at midnight local time
 */
export function parseDate(dateStr: CalendarDate): Date {
  const parts = dateStr.split('-');
  const y = Number(parts[0] || 0);
  const m = Number(parts[1] || 1);
  const d = Number(parts[2] || 1);
  return new Date(y, m - 1, d);
}

export function fmtDate(d: Date): CalendarDate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Computes the natural cycle bounds for a given reference date
 */
export function computeCycleBounds(
  refDateStr: CalendarDate,
  mode: Settings['cycleMode'],
  anchor: number
): { startDate: CalendarDate; endDate: CalendarDate } {
  const refDate = parseDate(refDateStr);
  const year = refDate.getFullYear();
  const month = refDate.getMonth();

  if (mode === 'calendarMonth') {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    return {
      startDate: fmtDate(start),
      endDate: fmtDate(end),
    };
  } else {
    // paydayToPayday
    const day = refDate.getDate();

    let startMonth = month;
    let startYear = year;

    if (day < anchor) {
      // If we are before the anchor, the cycle started the previous month
      startMonth = month - 1;
      if (startMonth < 0) {
        startMonth = 11;
        startYear--;
      }
    }

    const start = new Date(startYear, startMonth, anchor);
    const end = new Date(startYear, startMonth + 1, anchor - 1);

    return {
      startDate: fmtDate(start),
      endDate: fmtDate(end),
    };
  }
}

/**
 * Checks the cycle state
 */
export function checkCycleState(
  cycles: Cycle[],
  settings: Settings,
  today: CalendarDate = getTodayDate()
) {
  const activeCycle = cycles.find((c) => c.status === 'active');
  const { startDate, endDate } = computeCycleBounds(
    today,
    settings.cycleMode,
    settings.paydayAnchor
  );

  if (!activeCycle) {
    return {
      needsAction: true,
      actionType: 'create_first',
      suggestedBounds: { startDate, endDate },
      suggestedLabel: `Ciclo ${startDate.substring(5)}`,
    };
  }

  // If there is an active cycle, check if today is past its endDate
  if (today > activeCycle.endDate) {
    return {
      needsAction: true,
      actionType: 'close_and_open',
      activeCycle,
      suggestedBounds: { startDate, endDate },
      suggestedLabel: `Ciclo ${startDate.substring(5)}`,
    };
  }

  return {
    needsAction: false,
    activeCycle,
  };
}
