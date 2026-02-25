import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'food-compass-saved-locations';

/**
 * Manages location suggestions by merging:
 * 1. Locations extracted from live store items (database source — always up to date)
 * 2. Recently used locations from localStorage (fast/recent access)
 * Blank and whitespace-only entries are filtered out everywhere.
 */
export function useSavedLocations(storeLocations?: string[]) {
  const [savedLocations, setSavedLocations] = useState<string[]>([]);

  // Load from localStorage on mount, stripping any blanks that may have crept in
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        const cleaned = parsed.filter(loc => loc && loc.trim().length > 0);
        setSavedLocations(cleaned);
        // Write back cleaned list if anything was removed
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      }
    } catch (error) {
      console.error('Failed to load saved locations:', error);
    }
  }, []);

  // Save a location (adds if not exists, moves to top)
  const saveLocation = useCallback((location: string) => {
    if (!location || location.trim().length < 2) return;
    
    const trimmed = location.trim();
    setSavedLocations(prev => {
      const filtered = prev.filter(loc => loc.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered];
      const limited = updated.slice(0, 50);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      } catch (error) {
        console.error('Failed to save location:', error);
      }
      
      return limited;
    });
  }, []);

  // Build a merged, deduplicated list from store items + localStorage
  const getMergedLocations = useCallback((): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];

    // Store locations first (always authoritative)
    for (const loc of (storeLocations || [])) {
      const key = loc.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(loc.trim());
    }

    // Then localStorage (recently used, may add extras not yet in store)
    for (const loc of savedLocations) {
      const key = loc.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(loc.trim());
    }

    return result;
  }, [savedLocations, storeLocations]);

  // Get filtered suggestions for a query
  const getFilteredLocations = useCallback((query: string): string[] => {
    const all = getMergedLocations();

    if (!query || !query.trim()) return [];

    const lowerQuery = query.trim().toLowerCase();
    // Starts-with matches ranked first, then contains matches
    const startsWith = all.filter(loc => loc.toLowerCase().startsWith(lowerQuery));
    const contains = all.filter(loc => !loc.toLowerCase().startsWith(lowerQuery) && loc.toLowerCase().includes(lowerQuery));
    return [...startsWith, ...contains].slice(0, 10);
  }, [getMergedLocations]);

  return {
    savedLocations,
    saveLocation,
    getFilteredLocations,
  };
}
