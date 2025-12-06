import { create } from 'zustand';
import { FoodItem, LocationDetail } from './types';
import { getFoods, createFood, updateFood, deleteFood } from './api';

interface StoreState {
  items: FoodItem[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<FoodItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<FoodItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  checkAvailability: (item: FoodItem, locationId?: string) => { available: boolean; reason?: string };
}

function getDay(date: Date): number {
  return date.getDay();
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
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
      console.error('Failed to fetch items:', error);
      set({ isLoading: false });
    }
  },

  addItem: async (item) => {
    try {
      const newItem = await createFood(item);
      set((state) => ({ items: [...state.items, newItem] }));
    } catch (error) {
      console.error('Failed to add item:', error);
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
      console.error('Failed to update item:', error);
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
      console.error('Failed to remove item:', error);
      throw error;
    }
  },

  checkAvailability: (item: FoodItem, locationId?: string) => {
    if (item.type === 'home') return { available: true };

    let targetLocation: LocationDetail | undefined;
    if (locationId && item.locations) {
      targetLocation = item.locations.find(l => l.id === locationId);
    } else if (item.locations && item.locations.length > 0) {
      return { available: true };
    }

    const closedDays = targetLocation?.closedDays;
    const openingHours = targetLocation?.openingHours;

    const now = new Date();
    const currentDay = getDay(now);
    const currentTime = formatTime(now);

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
