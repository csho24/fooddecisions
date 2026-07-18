/** Singapore-local calendar/time helpers for stall hours and "today" checks. */

export const APP_TIMEZONE = 'Asia/Singapore';

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getSingaporeParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    weekday: read('weekday'),
    hour: read('hour'),
    minute: read('minute'),
  };
}

/** 0 = Sunday, matching `closedDays` elsewhere in the app. */
export function getSingaporeDayOfWeek(now = new Date()): number {
  const weekday = getSingaporeParts(now).weekday;
  return WEEKDAY_TO_INDEX[weekday] ?? new Date(now).getDay();
}

/** 24-hour clock string, e.g. "14:05". */
export function getSingaporeTimeHHmm(now = new Date()): string {
  const { hour, minute } = getSingaporeParts(now);
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

/** Local Singapore calendar date, e.g. "2026-07-18". */
export function getSingaporeTodayDateStr(now = new Date()): string {
  const { year, month, day } = getSingaporeParts(now);
  return `${year}-${month}-${day}`;
}
