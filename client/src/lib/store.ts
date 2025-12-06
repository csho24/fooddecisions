import { create } from 'zustand';
import { getDay, format } from 'date-fns';
import { getFoods, createFood, updateFood, deleteFood } from './api';

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

interface StoreState {
  items: FoodItem[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<FoodItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<FoodItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  checkAvailability: (item: FoodItem, locationId?: string) => { available: boolean; reason?: string };
}

export const useFoodStore = create<StoreState>()((set, get) => ({
  items: [],
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
