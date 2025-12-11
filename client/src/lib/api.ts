import type { FoodItem, ArchivedItem } from "./store";

export async function getFoods(): Promise<FoodItem[]> {
  const response = await fetch("/api/foods");
  if (!response.ok) throw new Error("Failed to fetch foods");
  const items = await response.json();
  return items.map((item: any) => ({
    ...item,
    id: item.id.toString(),
  }));
}

export async function createFood(data: Omit<FoodItem, "id">): Promise<FoodItem> {
  const response = await fetch("/api/foods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create food");
  const item = await response.json();
  return { ...item, id: item.id.toString() };
}

export async function updateFood(id: string, updates: Partial<FoodItem>): Promise<FoodItem> {
  const response = await fetch(`/api/foods/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update food");
  const item = await response.json();
  return { ...item, id: item.id.toString() };
}

export async function deleteFood(id: string): Promise<void> {
  const response = await fetch(`/api/foods/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete food");
}

export async function getArchives(): Promise<ArchivedItem[]> {
  const response = await fetch("/api/archives");
  if (!response.ok) throw new Error("Failed to fetch archives");
  const items = await response.json();
  return items.map((item: any) => ({
    ...item,
    id: item.id.toString(),
    itemId: item.itemId.toString(),
  }));
}

export async function createArchive(data: Omit<ArchivedItem, "id">): Promise<ArchivedItem> {
  const response = await fetch("/api/archives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create archive");
  const item = await response.json();
  return { ...item, id: item.id.toString(), itemId: item.itemId.toString() };
}
