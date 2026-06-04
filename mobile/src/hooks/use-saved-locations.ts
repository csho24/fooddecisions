import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Same key as web (`client/src/hooks/use-saved-locations.ts`) for consistent history. */
export const SAVED_LOCATIONS_STORAGE_KEY = 'food-compass-saved-locations';

/**
 * Location suggestions: store item locations + recently used (AsyncStorage).
 * API mirrors web hook for parity.
 */
export function useSavedLocations(storeLocations?: string[]) {
  const [savedLocations, setSavedLocations] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SAVED_LOCATIONS_STORAGE_KEY);
        if (!stored || cancelled) return;
        const parsed: string[] = JSON.parse(stored);
        const cleaned = parsed.filter((loc) => loc && loc.trim().length > 0);
        if (!cancelled) setSavedLocations(cleaned);
        if (cleaned.length !== parsed.length) {
          await AsyncStorage.setItem(SAVED_LOCATIONS_STORAGE_KEY, JSON.stringify(cleaned));
        }
      } catch (error) {
        console.error('Failed to load saved locations:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveLocation = useCallback((location: string) => {
    if (!location || location.trim().length < 2) return;

    const trimmed = location.trim();
    setSavedLocations((prev) => {
      const filtered = prev.filter((loc) => loc.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 50);
      AsyncStorage.setItem(SAVED_LOCATIONS_STORAGE_KEY, JSON.stringify(updated)).catch((err) =>
        console.error('Failed to save location:', err)
      );
      return updated;
    });
  }, []);

  const getMergedLocations = useCallback((): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const loc of storeLocations || []) {
      const key = loc.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(loc.trim());
    }

    for (const loc of savedLocations) {
      const key = loc.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(loc.trim());
    }

    return result;
  }, [savedLocations, storeLocations]);

  const getFilteredLocations = useCallback(
    (query: string): string[] => {
      const all = getMergedLocations();
      if (!query || !query.trim()) return [];

      const lowerQuery = query.trim().toLowerCase();
      const startsWith = all.filter((loc) => loc.toLowerCase().startsWith(lowerQuery));
      const contains = all.filter(
        (loc) =>
          !loc.toLowerCase().startsWith(lowerQuery) && loc.toLowerCase().includes(lowerQuery)
      );
      return [...startsWith, ...contains].slice(0, 10);
    },
    [getMergedLocations]
  );

  return {
    savedLocations,
    saveLocation,
    getFilteredLocations,
  };
}
