export type FoodType = 'home' | 'out';

export interface OpeningHours {
  open: string;
  close: string;
}

export interface LocationDetail {
  id: string;
  name: string;
  notes?: string;
  openingHours?: OpeningHours;
  closedDays?: number[];
}

export interface FoodItem {
  id: string;
  name: string;
  type: FoodType;
  category?: string;
  notes?: string;
  locations?: LocationDetail[];
}
