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
  // Future proofing for archive
  // archiveItem: (id: string, reason: 'eaten' | 'thrown') => void;
}

export const useFoodStore = create<StoreState>()(
  persist(
    (set, get) => ({
      items: [], 
      
      addItem: (item) => set((state) => ({
        items: [...state.items, { ...item, id: Math.random().toString(36).substr(2, 9) }]
      })),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),
      
      checkAvailability: (item: FoodItem) => {
        if (item.type === 'home') return { available: true };

        const now = new Date();
        const currentDay = getDay(now);
        const currentTime = format(now, 'HH:mm');
        const todayStr = format(now, 'yyyy-MM-dd');

        if (item.cleaningDates?.includes(todayStr)) {
          return { available: false, reason: 'Cleaning today' };
        }

        if (item.closedDays?.includes(currentDay)) {
          return { available: false, reason: 'Closed today' };
        }
        
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
