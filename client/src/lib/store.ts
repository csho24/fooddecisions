import { create } from 'zustand';
import { addDays, isBefore, parse, getDay, format } from 'date-fns';

export type FoodType = 'home' | 'out';

export interface OpeningHours {
  open: string; // "09:00"
  close: string; // "21:00"
}

export interface FoodItem {
  id: string;
  name: string;
  type: FoodType;
  location?: string; // For 'out'
  notes?: string;
  
  // Constraints
  closedDays?: number[]; // 0 = Sunday, 1 = Monday...
  openingHours?: OpeningHours;
  cleaningDates?: string[]; // ISO dates "2025-05-20"
}

interface StoreState {
  items: FoodItem[];
  filter: FoodType | 'all';
  addItem: (item: Omit<FoodItem, 'id'>) => void;
  removeItem: (id: string) => void;
  setFilter: (filter: FoodType | 'all') => void;
  getDecisions: () => FoodItem[];
}

// Mock Data
const MOCK_ITEMS: FoodItem[] = [
  {
    id: '1',
    name: 'Leftover Pizza',
    type: 'home',
    notes: 'In the fridge, heat up for 2 mins',
  },
  {
    id: '2',
    name: 'Spicy Instant Noodles',
    type: 'home',
    notes: 'Add an egg!',
  },
  {
    id: '3',
    name: 'Chicken Rice',
    type: 'out',
    location: 'Maxwell Food Centre',
    closedDays: [1], // Closed Mondays
    openingHours: { open: '10:00', close: '20:00' },
    notes: 'Long queue during lunch',
  },
  {
    id: '4',
    name: 'Burger King',
    type: 'out',
    location: 'Mall nearby',
    openingHours: { open: '08:00', close: '22:00' },
  },
  {
    id: '5',
    name: 'Pasta',
    type: 'home',
    notes: 'Need to buy sauce',
  },
  {
    id: '6',
    name: 'Sushi Place',
    type: 'out',
    location: 'Downtown',
    notes: 'Expensive but good',
  }
];

export const useFoodStore = create<StoreState>((set, get) => ({
  items: MOCK_ITEMS,
  filter: 'all',
  
  addItem: (item) => set((state) => ({
    items: [...state.items, { ...item, id: Math.random().toString(36).substr(2, 9) }]
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter((i) => i.id !== id)
  })),
  
  setFilter: (filter) => set({ filter }),
  
  getDecisions: () => {
    const { items, filter } = get();
    const now = new Date();
    const currentDay = getDay(now);
    const currentTime = format(now, 'HH:mm');
    
    return items.filter(item => {
      // 1. Type Filter
      if (filter !== 'all' && item.type !== filter) return false;
      
      // 2. Constraint Checks (only apply if we are actually deciding right now)
      // For simplicity, we assume "Decide" means "Right Now"
      
      // Check Closed Days
      if (item.closedDays?.includes(currentDay)) return false;
      
      // Check Opening Hours
      if (item.openingHours) {
        if (currentTime < item.openingHours.open || currentTime > item.openingHours.close) {
          return false;
        }
      }
      
      // Check Cleaning Dates (Simple string match for today)
      const todayStr = format(now, 'yyyy-MM-dd');
      if (item.cleaningDates?.includes(todayStr)) return false;
      
      return true;
    });
  }
}));
