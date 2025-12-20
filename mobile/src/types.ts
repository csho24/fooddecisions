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
  expiryDate?: string;
  locations?: LocationDetail[];
}

export interface ArchivedItem {
  id: string;
  itemId: string;
  name: string;
  category?: string;
  status: 'eaten' | 'thrown';
  archivedAt: string;
}
