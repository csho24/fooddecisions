/**
 * Shared utility functions used by both web and mobile apps
 */

/**
 * Capitalizes the first letter of each word after spaces
 * Example: "ayam bakar" -> "Ayam Bakar", "empress place" -> "Empress Place"
 */
export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalizes a location key for case-insensitive comparison
 * Example: "Margaret Drive" -> "margaret drive"
 */
export function normalizeLocKey(str: string): string {
  return str.trim().toLowerCase();
}

/** Normalize API/DB closure type strings for comparisons and styling. */
export function normalizeClosureType(
  type: string | undefined | null
): 'cleaning' | 'timeoff' {
  const t = String(type ?? '').toLowerCase().trim();
  if (t === 'timeoff' || t === 'time_off' || t === 'time-off' || t === 'time off') {
    return 'timeoff';
  }
  return 'cleaning';
}
