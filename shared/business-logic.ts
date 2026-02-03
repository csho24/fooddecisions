/**
 * Shared business logic functions used by both web and mobile apps
 */

import type { FoodItem } from "./schema";
import { capitalizeWords, normalizeLocKey } from "./utils";

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
