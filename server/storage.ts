import { eq } from "drizzle-orm";
import { type User, type InsertUser, type FoodItem, type InsertFoodItem, type UpdateFoodItem, foodItems } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "@db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getFoodItems(): Promise<FoodItem[]>;
  getFoodItem(id: number): Promise<FoodItem | undefined>;
  createFoodItem(item: InsertFoodItem): Promise<FoodItem>;
  updateFoodItem(id: number, updates: UpdateFoodItem): Promise<FoodItem | undefined>;
  deleteFoodItem(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    throw new Error("Auth not implemented");
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    throw new Error("Auth not implemented");
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    throw new Error("Auth not implemented");
  }

  async getFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems);
  }

  async getFoodItem(id: number): Promise<FoodItem | undefined> {
    const results = await db.select().from(foodItems).where(eq(foodItems.id, id));
    return results[0];
  }

  async createFoodItem(item: InsertFoodItem): Promise<FoodItem> {
    const results = await db.insert(foodItems).values(item).returning();
    return results[0];
  }

  async updateFoodItem(id: number, updates: UpdateFoodItem): Promise<FoodItem | undefined> {
    const results = await db.update(foodItems)
      .set(updates)
      .where(eq(foodItems.id, id))
      .returning();
    return results[0];
  }

  async deleteFoodItem(id: number): Promise<void> {
    await db.delete(foodItems).where(eq(foodItems.id, id));
  }
}

export const storage = new DatabaseStorage();
