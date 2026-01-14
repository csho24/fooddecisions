import Constants from 'expo-constants';
import { FoodItem, ArchivedItem } from './types';

const API_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'https://fooddecisions.onrender.com';

export async function getFoods(): Promise<FoodItem[]> {
  const response = await fetch(`${API_URL}/api/foods`);
  if (!response.ok) throw new Error('Failed to fetch foods');
  const items = await response.json();
  return items.map((item: any) => ({
    ...item,
    id: item.id.toString(),
  }));
}

export async function createFood(data: Omit<FoodItem, 'id'>): Promise<FoodItem> {
  const response = await fetch(`${API_URL}/api/foods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create food');
  const item = await response.json();
  return { ...item, id: item.id.toString() };
}

export async function updateFood(id: string, updates: Partial<FoodItem>): Promise<FoodItem> {
  const response = await fetch(`${API_URL}/api/foods/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update food');
  const item = await response.json();
  return { ...item, id: item.id.toString() };
}

export async function deleteFood(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/foods/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete food');
}

export async function createArchive(data: Omit<ArchivedItem, 'id'>): Promise<ArchivedItem> {
  const response = await fetch(`${API_URL}/api/archives`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create archive');
  const item = await response.json();
  return { ...item, id: item.id.toString(), itemId: item.itemId.toString() };
}

// Closure Schedules
export interface ClosureSchedule {
  id: number;
  type: 'cleaning' | 'timeoff';
  date: string;
  location?: string;
  foodItemId?: string;
  foodItemName?: string;
  createdAt: string;
}

export async function getClosureSchedules(): Promise<ClosureSchedule[]> {
  const response = await fetch(`${API_URL}/api/closures`);
  if (!response.ok) throw new Error('Failed to fetch closure schedules');
  return await response.json();
}

export async function createClosureSchedules(
  schedules: Array<{ type: 'cleaning' | 'timeoff'; date: string; location?: string; foodItemId?: string; foodItemName?: string }>
): Promise<ClosureSchedule[]> {
  const response = await fetch(`${API_URL}/api/closures`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schedules }),
  });
  if (!response.ok) throw new Error('Failed to create closure schedules');
  return await response.json();
}
