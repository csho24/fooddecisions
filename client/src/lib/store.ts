import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getDay, format } from 'date-fns';

export type FoodType = 'home' | 'out';

export interface OpeningHours {
  open: string; // "09:00"
  close: string; // "21:00"
}

export interface FoodItem {
  id: string;
  name: string;
  type: FoodType;
  
  // For 'out' items
  location?: string; 
  
  // For 'home' items
  category?: string; // e.g. "Fridge", "Snacks"

  notes?: string;
  
  // Constraints
  closedDays?: number[]; // 0 = Sunday, 1 = Monday...
  openingHours?: OpeningHours;
  cleaningDates?: string[]; // ISO dates "2025-05-20"
}

interface StoreState {
  items: FoodItem[];
  addItem: (item: Omit<FoodItem, 'id'>) => void;
  removeItem: (id: string) => void;
  checkAvailability: (item: FoodItem) => { available: boolean; reason?: string };
}

export const useFoodStore = create<StoreState>()(
  persist(
    (set, get) => ({
      items: [], // Start empty as requested
      
      addItem: (item) => set((state) => ({
        items: [...state.items, { ...item, id: Math.random().toString(36).substr(2, 9) }]
      })),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),
      
      checkAvailability: (item: FoodItem) => {
        // Home items are always available in this simplified model
        if (item.type === 'home') return { available: true };

        const now = new Date();
        const currentDay = getDay(now);
        const currentTime = format(now, 'HH:mm');
        const todayStr = format(now, 'yyyy-MM-dd');

        // Check Cleaning Dates
        if (item.cleaningDates?.includes(todayStr)) {
          return { available: false, reason: 'Cleaning today' };
        }

        // Check Closed Days
        if (item.closedDays?.includes(currentDay)) {
          return { available: false, reason: 'Closed today' };
        }
        
        // Check Opening Hours
        if (item.openingHours) {
          if (currentTime < item.openingHours.open || currentTime > item.openingHours.close) {
            return { available: false, reason: `Opens ${item.openingHours.open} - ${item.openingHours.close}` };
          }
        }

        return { available: true };
      }
    }),
    {
      name: 'food-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
