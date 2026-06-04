/**
 * Shared business logic functions used by both web and mobile apps
 */

import type { FoodItem } from "./schema";
import { capitalizeWords, normalizeLocKey, normalizeClosureType } from "./utils";

/**
 * Closure schedule type
 */
export interface ClosureSchedule {
  id: number;
  type: 'cleaning' | 'timeoff';
  date: string;
  location?: string;
  foodItemId?: string;
  foodItemName?: string;
  createdAt: string;
}

/**
 * Categorizes food items into predefined categories based on their names
 */
export type FoodCategory = 'Noodles' | 'Rice' | 'Ethnic' | 'Light' | 'Western';

export function categorizeFood(name: string): FoodCategory {
  const lowerName = name.toLowerCase();
  
  // Noodles
  if (
    lowerName.includes('noodle') ||
    lowerName.includes('mee') ||
    lowerName.includes('pasta') ||
    lowerName.includes('ramen') ||
    lowerName.includes('laksa') ||
    lowerName.includes('mee goreng') ||
    lowerName.includes('mee rebus') ||
    lowerName.includes('wonton') ||
    lowerName.includes('wantan')
  ) {
    return 'Noodles';
  }
  
  // Rice
  if (
    lowerName.includes('rice') ||
    lowerName.includes('nasi') ||
    lowerName.includes('fried rice') ||
    lowerName.includes('chicken rice') ||
    lowerName.includes('claypot') ||
    lowerName.includes('clay pot') ||
    lowerName.includes('biryani') ||
    lowerName.includes('risotto')
  ) {
    return 'Rice';
  }
  
  // Western
  if (
    lowerName.includes('burger') ||
    lowerName.includes('chicken chop') ||
    lowerName.includes('fish and chips') ||
    lowerName.includes('fish & chips') ||
    lowerName.includes('pizza') ||
    lowerName.includes('steak') ||
    lowerName.includes('pasta') ||
    lowerName.includes('spaghetti') ||
    lowerName.includes('sandwich') ||
    lowerName.includes('wrap')
  ) {
    return 'Western';
  }
  
  // Light
  if (
    lowerName.includes('hum chim peng') ||
    lowerName.includes('chee cheong fan') ||
    lowerName.includes('popiah') ||
    lowerName.includes('dim sum') ||
    lowerName.includes('dumpling') ||
    lowerName.includes('bao') ||
    lowerName.includes('steamed') ||
    lowerName.includes('soup') ||
    lowerName.includes('salad')
  ) {
    return 'Light';
  }
  
  // Default to Ethnic for everything else (Asian dishes that don't fit above)
  return 'Ethnic';
}

/**
 * Gets the display location for a closure schedule.
 * Prefers the full location name from the food item when available.
 * 
 * @param c - The closure schedule
 * @param items - Array of food items to search for location matches
 * @returns The display location name (capitalized)
 */
export function getClosureDisplayLocation(
  c: ClosureSchedule,
  items: FoodItem[]
): string {
  if (c.foodItemId && items.length > 0) {
    const item = items.find(i => i.id === c.foodItemId);
    if (item?.locations?.length) {
      const savedLoc = (c.location ?? '').trim().toLowerCase();
      if (savedLoc) {
        // Try exact match first (case-insensitive)
        const exactMatch = item.locations.find(loc =>
          loc.name.trim().toLowerCase() === savedLoc
        );
        if (exactMatch) return capitalizeWords(exactMatch.name);
        
        // Then try partial match (for legacy data)
        const partialMatch = item.locations.find(loc =>
          loc.name.toLowerCase().includes(savedLoc) || savedLoc.includes(loc.name.toLowerCase())
        );
        if (partialMatch) return capitalizeWords(partialMatch.name);
      }
      // Fallback to first location
      return capitalizeWords(item.locations[0].name);
    }
  }
  // Return saved location, capitalized
  return c.location ? capitalizeWords(c.location) : '';
}

/** Grouped row for Scheduled Closures list (matches web add-details.tsx). */
export type CleaningClosureGroup = {
  kind: 'cleaning';
  dateRange: string;
  startDate: string;
  displayLoc: string;
  ids: number[];
};

export type TimeOffClosureGroup = {
  kind: 'timeoff';
  dateRange: string;
  startDate: string;
  displayLabel: string;
  ids: number[];
};

export type ClosureListGroup = CleaningClosureGroup | TimeOffClosureGroup;

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatClosureDateRange(start: string, end: string): string {
  const [, m1, d1] = start.split('-').map(Number);
  const [, m2, d2] = end.split('-').map(Number);
  if (start === end) return `${d1} ${MONTHS_SHORT[m1 - 1]}`;
  if (m1 === m2) return `${d1}–${d2} ${MONTHS_SHORT[m1 - 1]}`;
  return `${d1} ${MONTHS_SHORT[m1 - 1]}–${d2} ${MONTHS_SHORT[m2 - 1]}`;
}

function mergeConsecutiveClosureDates(
  dateToIds: Map<string, number[]>
): Array<{ dateRange: string; startDate: string; ids: number[] }> {
  const sortedDates = Array.from(dateToIds.keys()).sort();
  if (sortedDates.length === 0) return [];
  const ranges: Array<{ start: string; end: string; ids: number[] }> = [];
  let current: string[] = [];
  for (const d of sortedDates) {
    if (current.length === 0) {
      current = [d];
      continue;
    }
    const prev = current[current.length - 1];
    const diffDays =
      (new Date(d).getTime() - new Date(prev).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      current.push(d);
    } else {
      ranges.push({
        start: current[0],
        end: current[current.length - 1],
        ids: current.flatMap((date) => dateToIds.get(date) ?? []),
      });
      current = [d];
    }
  }
  ranges.push({
    start: current[0],
    end: current[current.length - 1],
    ids: current.flatMap((date) => dateToIds.get(date) ?? []),
  });
  return ranges.map((r) => ({
    dateRange: formatClosureDateRange(r.start, r.end),
    startDate: r.start,
    ids: r.ids,
  }));
}

export function buildCleaningClosureGroups(
  closures: ClosureSchedule[],
  getDisplayLoc: (c: ClosureSchedule) => string
): CleaningClosureGroup[] {
  const cleaning = closures.filter((c) => normalizeClosureType(c.type) === 'cleaning');
  const byLoc = new Map<string, { displayLoc: string; dateToIds: Map<string, number[]> }>();
  for (const c of cleaning) {
    const displayLoc = getDisplayLoc(c);
    const locKey = normalizeLocKey(displayLoc);
    if (!byLoc.has(locKey)) byLoc.set(locKey, { displayLoc, dateToIds: new Map() });
    const entry = byLoc.get(locKey)!;
    const ids = entry.dateToIds.get(c.date) ?? [];
    ids.push(c.id);
    entry.dateToIds.set(c.date, ids);
  }
  const result: CleaningClosureGroup[] = [];
  for (const { displayLoc, dateToIds } of Array.from(byLoc.values())) {
    for (const { dateRange, startDate, ids } of mergeConsecutiveClosureDates(dateToIds)) {
      result.push({ kind: 'cleaning', dateRange, startDate, displayLoc, ids });
    }
  }
  return result;
}

export function buildTimeOffClosureGroups(
  closures: ClosureSchedule[],
  getDisplayLoc: (c: ClosureSchedule) => string
): TimeOffClosureGroup[] {
  const timeoff = closures.filter((c) => normalizeClosureType(c.type) === 'timeoff');
  const byStall = new Map<string, { displayLabel: string; dateToIds: Map<string, number[]> }>();
  for (const c of timeoff) {
    const displayLoc = getDisplayLoc(c);
    const label =
      displayLoc && c.foodItemName
        ? `${displayLoc} › ${c.foodItemName}`
        : c.foodItemName || displayLoc || '';
    const stallKey =
      normalizeLocKey(displayLoc || '') + '|' + normalizeLocKey(c.foodItemName || '');
    if (!byStall.has(stallKey)) byStall.set(stallKey, { displayLabel: label, dateToIds: new Map() });
    const entry = byStall.get(stallKey)!;
    const ids = entry.dateToIds.get(c.date) ?? [];
    ids.push(c.id);
    entry.dateToIds.set(c.date, ids);
  }
  const result: TimeOffClosureGroup[] = [];
  for (const { displayLabel, dateToIds } of Array.from(byStall.values())) {
    for (const { dateRange, startDate, ids } of mergeConsecutiveClosureDates(dateToIds)) {
      result.push({ kind: 'timeoff', dateRange, startDate, displayLabel, ids });
    }
  }
  return result;
}

/** Upcoming list entries sorted by start date (cleaning + time off interleaved). */
export function buildScheduledClosureList(
  closures: ClosureSchedule[],
  getDisplayLoc: (c: ClosureSchedule) => string,
  todayStr: string
): ClosureListGroup[] {
  const upcoming = closures.filter((c) => c.date >= todayStr);
  return [
    ...buildCleaningClosureGroups(upcoming, getDisplayLoc),
    ...buildTimeOffClosureGroups(upcoming, getDisplayLoc),
  ].sort((a, b) => a.startDate.localeCompare(b.startDate));
}
