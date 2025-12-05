import { create } from 'zustand';
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
  category?: string; // e.g. "Frozen", "Pantry", "Leftovers"

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

// Mock Data
const MOCK_ITEMS: FoodItem[] = [
  {
    id: '1',
    name: 'Leftover Pizza',
    type: 'home',
    category: 'Leftovers',
    notes: 'In the fridge, heat up for 2 mins',
  },
  {
    id: '2',
    name: 'Spicy Instant Noodles',
    type: 'home',
    category: 'Pantry',
    notes: 'Add an egg!',
  },
  {
    id: '3',
    name: 'Tian Tian Chicken Rice',
    type: 'out',
    location: 'Maxwell Food Centre',
    closedDays: [1], // Closed Mondays
    openingHours: { open: '10:00', close: '20:00' },
    notes: 'Long queue during lunch',
  },
  {
    id: '4',
    name: 'Ah Tai Chicken Rice',
    type: 'out',
    location: 'Maxwell Food Centre',
    openingHours: { open: '11:00', close: '19:30' },
    closedDays: [2], // Closed Tuesdays
  },
  {
    id: '5',
    name: 'Burger King',
    type: 'out',
    location: 'Bedok Mall',
    openingHours: { open: '08:00', close: '22:00' },
  },
  {
    id: '6',
    name: 'Pasta Ingredients',
    type: 'home',
    category: 'Pantry',
    notes: 'Need to buy sauce',
  },
  {
    id: '7',
    name: 'Sushi Express',
    type: 'out',
    location: 'Bedok Mall',
    notes: 'Quick and cheap',
  }
];

export const useFoodStore = create<StoreState>((set, get) => ({
  items: MOCK_ITEMS,
  
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
}));
