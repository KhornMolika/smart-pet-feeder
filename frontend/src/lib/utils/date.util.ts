export function formatTime(timeStr: string): string {
  if (!timeStr) return '--:--';
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '--';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatRelativeTime(isoString: string): string {
  if (!isoString) return '--';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

export function getCountdownUntil(isoString: string): string {
  if (!isoString) return '--';
  const diffMs = new Date(isoString).getTime() - Date.now();
  if (diffMs <= 0) return 'Due now';
  const diffMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (hours === 0) return `in ${mins}m`;
  return `in ${hours}h ${mins}m`;
}

/**
 * Formats milliseconds into human-readable duration (e.g. 30s, 1m, 1m 30s, 3m)
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

/**
 * Calculates the next upcoming scheduled feeding time from a list of schedules as an ISO string
 */
export function getNextScheduledIso(
  schedules: { enabled: boolean; timeLocal: string; daysOfWeek: number[] }[]
): string | null {
  const activeSchedules = schedules.filter((s) => s.enabled && s.timeLocal);
  if (activeSchedules.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...

  // 1. Check for remaining scheduled feeds today
  const todaySchedules = activeSchedules
    .filter((s) => s.daysOfWeek.includes(currentDayOfWeek))
    .map((s) => {
      const [h, m] = s.timeLocal.split(':').map((v) => parseInt(v, 10));
      return { schedule: s, minutes: h * 60 + m, hours: h, minutesPart: m };
    })
    .filter((s) => s.minutes > currentMinutes)
    .sort((a, b) => a.minutes - b.minutes);

  if (todaySchedules.length > 0) {
    const next = todaySchedules[0];
    const target = new Date(now);
    target.setHours(next.hours, next.minutesPart, 0, 0);
    return target.toISOString();
  }

  // 2. Check upcoming days (up to 7 days ahead)
  for (let offset = 1; offset <= 7; offset++) {
    const targetDay = (currentDayOfWeek + offset) % 7;
    const daySchedules = activeSchedules
      .filter((s) => s.daysOfWeek.includes(targetDay))
      .map((s) => {
        const [h, m] = s.timeLocal.split(':').map((v) => parseInt(v, 10));
        return { schedule: s, minutes: h * 60 + m, hours: h, minutesPart: m };
      })
      .sort((a, b) => a.minutes - b.minutes);

    if (daySchedules.length > 0) {
      const next = daySchedules[0];
      const target = new Date(now);
      target.setDate(now.getDate() + offset);
      target.setHours(next.hours, next.minutesPart, 0, 0);
      return target.toISOString();
    }
  }

  return null;
}

/**
 * Returns human-readable label for schedule days (e.g. Everyday, Weekdays, Weekends, Mon/Wed/Fri)
 */
export function formatDaysOfWeek(daysOfWeek: number[]): string {
  if (!daysOfWeek || daysOfWeek.length === 0) return 'No days selected';
  if (daysOfWeek.length === 7) return 'Everyday';
  const isWeekdays =
    daysOfWeek.length === 5 && [1, 2, 3, 4, 5].every((d) => daysOfWeek.includes(d));
  if (isWeekdays) return 'Weekdays (Mon–Fri)';
  const isWeekends =
    daysOfWeek.length === 2 && [6, 0].every((d) => daysOfWeek.includes(d));
  if (isWeekends) return 'Weekends (Sat–Sun)';

  const dayLabels: Record<number, string> = {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
    0: 'Sun',
  };
  return daysOfWeek
    .slice()
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
    .map((d) => dayLabels[d] || '')
    .filter(Boolean)
    .join(', ');
}

/**
 * Calculates count of scheduled meals for each day of week (0 to 6)
 */
export function getWeeklyMealCounts(
  schedules: { enabled: boolean; daysOfWeek: number[] }[]
): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
  const active = schedules.filter((s) => s.enabled);
  for (const s of active) {
    for (const d of s.daysOfWeek) {
      if (counts[d] !== undefined) {
        counts[d]++;
      }
    }
  }
  return counts;
}

/**
 * Calculates the target number of meals for today based on active schedules
 */
export function getTodayMealsTarget(
  schedules: { enabled: boolean; daysOfWeek: number[] }[],
  fallbackTarget: number = 3
): number {
  const currentDay = new Date().getDay();
  const todaySchedules = schedules.filter((s) => s.enabled && s.daysOfWeek.includes(currentDay));
  return todaySchedules.length > 0 ? todaySchedules.length : fallbackTarget;
}

/**
 * Checks if two Date objects fall on the exact same calendar day
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Formats a Date or ISO string into YYYY-MM-DD string in local time
 */
export function formatDateOnly(isoString: string | Date): string {
  const d = typeof isoString === 'string' ? new Date(isoString) : isoString;
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats date into a user-friendly grouping header (e.g. "Today • Thu, Oct 15", "Yesterday • Wed, Oct 14", or "Mon, Oct 12, 2026")
 */
export function formatDateHeader(isoString: string, referenceDate?: Date | null): string {
  if (!isoString) return '--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--';

  if (!referenceDate) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (eventDay.getTime() === today.getTime()) {
    const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return `Today • ${formatted}`;
  }
  if (eventDay.getTime() === yesterday.getTime()) {
    const formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return `Yesterday • ${formatted}`;
  }

  // Same year: include weekday, month, day
  if (d.getFullYear() === referenceDate.getFullYear()) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats time only (e.g. "07:30 AM")
 */
export function formatTimeOnly(isoString: string): string {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Estimates portion weight in grams based on dispense duration (approx 2.5g kibble per second)
 */
export function calculatePortionWeight(durationMs: number): number {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  return Math.round(seconds * 2.5);
}

/**
 * Returns a human-friendly portion descriptor based on duration
 */
export function getPortionSizeLabel(durationMs: number): string {
  const seconds = durationMs / 1000;
  if (seconds <= 20) return 'Quick Snack';
  if (seconds <= 45) return 'Medium Portion';
  if (seconds <= 90) return 'Standard Meal';
  return 'Hearty Feast';
}

/**
 * Formats a Date Range into human readable string (e.g. "Oct 10 – Oct 15" or "Oct 15, 2026")
 */
export function formatDateRangeLabel(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return 'Date Range';
  if (startDate && endDate) {
    if (startDate === endDate) {
      const parts = startDate.split('-').map((v) => parseInt(v, 10));
      if (parts.length === 3) {
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      return startDate;
    }
    const sp = startDate.split('-').map((v) => parseInt(v, 10));
    const ep = endDate.split('-').map((v) => parseInt(v, 10));
    if (sp.length === 3 && ep.length === 3) {
      const sDate = new Date(sp[0], sp[1] - 1, sp[2]);
      const eDate = new Date(ep[0], ep[1] - 1, ep[2]);
      return `${sDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${eDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return `${startDate} – ${endDate}`;
  }
  if (startDate) return `From ${startDate}`;
  return `Until ${endDate}`;
}

/**
 * Returns YYYY-MM-DD for N days ago in local time
 */
export function getPastDateOnly(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatDateOnly(d);
}



