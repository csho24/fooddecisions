import { create } from 'zustand';
import { getDay, format } from 'date-fns';
import { getFoods, createFood, updateFood, deleteFood, getArchives, createArchive } from './api';

export type FoodType = 'home' | 'out';

export interface OpeningHours {
  open: string; // "09:00"
  close: string; // "21:00"
}

export interface LocationDetail {
  id: string;
  name: string; // The location name e.g. "Maxwell"
  notes?: string;
  openingHours?: OpeningHours;
  closedDays?: number[]; // 0 = Sunday
}

export interface FoodItem {
  id: string;
  name: string;
  type: FoodType;
  
  // For 'home' items
  category?: string; 
  notes?: string;
  
  // For 'out' items - New Structure
  locations?: LocationDetail[];
  
  // Legacy fields for backward compatibility/migration (optional)
  location?: string; 
  closedDays?: number[];
  openingHours?: OpeningHours;
  cleaningDates?: string[]; 
}

export interface ArchivedItem {
  id: string;
  itemId: string;
  name: string;
  category?: string;
  status: 'eaten' | 'thrown';
  archivedAt: string;
}

interface StoreState {
  items: FoodItem[];
  archivedItems: ArchivedItem[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  fetchArchives: () => Promise<void>;
  addItem: (item: Omit<FoodItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<FoodItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  archiveItem: (id: string, status: 'eaten' | 'thrown') => Promise<void>;
  checkAvailability: (item: FoodItem, locationId?: string) => { available: boolean; reason?: string };
}

export const useFoodStore = create<StoreState>()((set, get) => ({
  items: [],
  archivedItems: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const items = await getFoods();
      set({ items, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch items:", error);
      set({ isLoading: false });
    }
  },

  fetchArchives: async () => {
    try {
      const archivedItems = await getArchives();
      console.log(`Fetched ${archivedItems.length} archived items`);
      set({ archivedItems });
    } catch (error) {
      console.error("Failed to fetch archives:", error);
      // Set empty array on error so UI doesn't show stale data
      set({ archivedItems: [] });
    }
  },

  addItem: async (item) => {
    try {
      const newItem = await createFood(item);
      set((state) => ({ items: [...state.items, newItem] }));
    } catch (error) {
      console.error("Failed to add item:", error);
      throw error;
    }
  },

  updateItem: async (id, updates) => {
    try {
      const updatedItem = await updateFood(id, updates);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updatedItem : item)),
      }));
    } catch (error) {
      console.error("Failed to update item:", error);
      throw error;
    }
  },

  removeItem: async (id) => {
    try {
      await deleteFood(id);
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
      }));
    } catch (error) {
      console.error("Failed to remove item:", error);
      throw error;
    }
  },

  archiveItem: async (id, status) => {
    try {
      const state = get();
      const item = state.items.find((i) => i.id === id);
      if (!item) return;

      // Create archived item in database
      const archivedItem = await createArchive({
        itemId: id,
        name: item.name,
        category: item.category,
        status,
        archivedAt: new Date().toISOString(),
      });

      // Remove from active items
      await deleteFood(id);
      
      // Update state
      set({
        items: state.items.filter((i) => i.id !== id),
        archivedItems: [...state.archivedItems, archivedItem],
      });
    } catch (error) {
      console.error("Failed to archive item:", error);
      throw error;
    }
  },
      
      checkAvailability: (item: FoodItem, locationId?: string) => {
        if (item.type === 'home') return { available: true };

        // If checking a specific location
        let targetLocation: LocationDetail | undefined;
        if (locationId && item.locations) {
          targetLocation = item.locations.find(l => l.id === locationId);
        } else if (item.locations && item.locations.length > 0) {
           // If no location specified, check if ANY location is open? 
           // Or just return true? Let's default to true unless all are closed.
           // For simplicity in list view, we might just say available.
           return { available: true };
        }

        // Fallback for legacy items or single location logic
        const closedDays = targetLocation ? targetLocation.closedDays : item.closedDays;
        const openingHours = targetLocation ? targetLocation.openingHours : item.openingHours;

        const now = new Date();
        const currentDay = getDay(now);
        const currentTime = format(now, 'HH:mm');
        
        if (closedDays?.includes(currentDay)) {
          return { available: false, reason: 'Closed today' };
        }
        
        if (openingHours) {
          if (currentTime < openingHours.open || currentTime > openingHours.close) {
            return { available: false, reason: `Opens ${openingHours.open} - ${openingHours.close}` };
          }
        }

        return { available: true };
      }
}));
