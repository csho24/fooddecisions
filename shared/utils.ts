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
