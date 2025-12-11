import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'food-compass-saved-locations';

export function useSavedLocations() {
  const [savedLocations, setSavedLocations] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedLocations(JSON.parse(stored));
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
      // Remove if exists, then add to front
      const filtered = prev.filter(loc => loc.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered];
      
      // Limit to 50 locations
      const limited = updated.slice(0, 50);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      } catch (error) {
        console.error('Failed to save location:', error);
      }
      
      return limited;
    });
  }, []);

  // Get filtered locations based on search query
  const getFilteredLocations = useCallback((query: string): string[] => {
    if (!query) return savedLocations.slice(0, 10); // Show top 10 when no query
    
    const lowerQuery = query.toLowerCase();
    return savedLocations.filter(loc => 
      loc.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
  }, [savedLocations]);

  return {
    savedLocations,
    saveLocation,
    getFilteredLocations,
  };
}
