import { getSingaporeDayOfWeek, getSingaporeTimeHHmm } from './singapore-time';

export interface OpeningHours {
  open: string;
  close: string;
}

export interface AvailabilityLocation {
  id: string;
  closedDays?: number[];
  openingHours?: OpeningHours;
}

export interface AvailabilityItem {
  type: string;
  closedDays?: number[];
  openingHours?: OpeningHours;
  locations?: AvailabilityLocation[];
}

export interface AvailabilityStatus {
  available: boolean;
  reason?: string;
}

export function checkLocationAvailability(
  closedDays: number[] | undefined,
  openingHours: OpeningHours | undefined,
  now = new Date()
): AvailabilityStatus {
  const currentDay = getSingaporeDayOfWeek(now);
  const currentTime = getSingaporeTimeHHmm(now);

  if (closedDays?.includes(currentDay)) {
    return { available: false, reason: 'Closed today' };
  }

  if (openingHours) {
    if (currentTime < openingHours.open || currentTime > openingHours.close) {
      return { available: false, reason: 'Closed now' };
    }
  }

  return { available: true };
}

export function checkAvailability(
  item: AvailabilityItem,
  locationId?: string,
  now = new Date()
): AvailabilityStatus {
  if (item.type === 'home') return { available: true };

  let targetLocation: AvailabilityLocation | undefined;
  if (locationId && item.locations) {
    targetLocation = item.locations.find((location) => location.id === locationId);
  } else if (item.locations && item.locations.length > 0) {
    return { available: true };
  }

  const closedDays = targetLocation?.closedDays ?? item.closedDays;
  const openingHours = targetLocation?.openingHours ?? item.openingHours;

  return checkLocationAvailability(closedDays, openingHours, now);
}
