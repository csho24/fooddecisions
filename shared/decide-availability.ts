import {
  checkLocationAvailability,
  type AvailabilityItem,
  type AvailabilityLocation,
} from './availability';
import { getSingaporeDayOfWeek } from './singapore-time';
import { normalizeClosureType, normalizeLocKey } from './utils';

export interface TodayClosure {
  type: string;
  location?: string | null;
  foodItemId?: string | null;
  foodItemName?: string | null;
}

export interface DecideOutStatus {
  available: boolean;
  reason?: string;
  /** Cleaning / time off from the calendar (Decide red tint) */
  closedBySchedule: boolean;
}

/** Same rule as the home page grey “regular closure” lines. */
export function isRegularClosedTodayAtLocation(
  loc: Pick<AvailabilityLocation, 'closedDays'>,
  now = new Date()
): boolean {
  const closedDays = loc.closedDays;
  if (!closedDays?.length) return false;
  if (closedDays.length > 5) return false;
  return closedDays.includes(getSingaporeDayOfWeek(now));
}

function stallScheduleClosure(
  item: { id?: string; name?: string },
  todaysClosures: TodayClosure[],
  locKey: string | null
): 'timeoff' | 'cleaning' | null {
  const itemIdKey = item.id?.toString().trim().toLowerCase();
  const itemNameKey = item.name?.trim().toLowerCase() ?? '';

  const candidates = todaysClosures.filter((c) => {
    if (itemIdKey && c.foodItemId?.toString().trim().toLowerCase() === itemIdKey) return true;
    if (itemNameKey && c.foodItemName?.trim().toLowerCase() === itemNameKey) return true;
    return false;
  });

  const timeOff = candidates.filter((c) => normalizeClosureType(c.type) === 'timeoff');
  if (timeOff.length > 0) {
    const stallWide = timeOff.find((c) => !normalizeLocKey(c.location || ''));
    if (stallWide) return 'timeoff';
    if (locKey) {
      if (timeOff.some((c) => normalizeLocKey(c.location || '') === locKey)) return 'timeoff';
    } else {
      return 'timeoff';
    }
  }

  const cleaning = candidates.filter((c) => normalizeClosureType(c.type) === 'cleaning');
  if (cleaning.length > 0) {
    if (!locKey) return 'cleaning';
    if (cleaning.some((c) => normalizeLocKey(c.location || '') === locKey)) return 'cleaning';
  }

  if (locKey && itemNameKey) {
    const locRows = todaysClosures.filter(
      (c) => normalizeLocKey(c.location || '') === locKey
    );
    if (
      locRows.some(
        (c) =>
          normalizeClosureType(c.type) === 'timeoff' &&
          c.foodItemName?.trim().toLowerCase() === itemNameKey
      )
    ) {
      return 'timeoff';
    }
    if (
      locRows.some(
        (c) =>
          normalizeClosureType(c.type) === 'cleaning' &&
          c.foodItemName?.trim().toLowerCase() === itemNameKey
      )
    ) {
      return 'cleaning';
    }
  }

  return null;
}

function hasCleaningAtLocationToday(todaysClosures: TodayClosure[], locKey: string): boolean {
  return todaysClosures.some(
    (c) =>
      normalizeClosureType(c.type) === 'cleaning' &&
      normalizeLocKey(c.location || '') === locKey
  );
}

/**
 * Out stall status when browsing Decide → Location → [place].
 * Aligns with the home “Closed Today” banner: weekly rest days + today’s calendar closures.
 * Schedule reasons (cleaning / time off) take priority over regular closed days.
 */
export function getOutDecideStatusAtLocation(
  item: AvailabilityItem & { id?: string; name?: string },
  locationName: string,
  todaysClosures: TodayClosure[],
  now = new Date()
): DecideOutStatus {
  if (item.type !== 'out') {
    return { available: true, closedBySchedule: false };
  }

  const locKey = normalizeLocKey(locationName);
  const target = item.locations?.find((l) => normalizeLocKey(l.name) === locKey);
  if (!target) {
    return { available: true, closedBySchedule: false };
  }

  const scheduleKind = stallScheduleClosure(item, todaysClosures, locKey);
  if (scheduleKind === 'timeoff') {
    return {
      available: false,
      reason: 'Closed for time off',
      closedBySchedule: true,
    };
  }
  if (scheduleKind === 'cleaning') {
    return {
      available: false,
      reason: 'Closed for cleaning',
      closedBySchedule: true,
    };
  }

  // Home cleaning banner is per hawker/location — treat any cleaning there as closed for all stalls.
  if (hasCleaningAtLocationToday(todaysClosures, locKey)) {
    return {
      available: false,
      reason: 'Closed for cleaning',
      closedBySchedule: true,
    };
  }

  if (isRegularClosedTodayAtLocation(target, now)) {
    return {
      available: false,
      reason: 'Closed today',
      closedBySchedule: false,
    };
  }

  const hoursStatus = checkLocationAvailability(
    target.closedDays,
    target.openingHours,
    now
  );
  if (!hoursStatus.available) {
    return { ...hoursStatus, closedBySchedule: false };
  }

  return { available: true, closedBySchedule: false };
}
