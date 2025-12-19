import { eq } from "drizzle-orm";
import { type User, type InsertUser, type FoodItem, type InsertFoodItem, type UpdateFoodItem, type ArchivedItem, type InsertArchivedItem, type ClosureSchedule, type InsertClosureSchedule, foodItems, archivedItems, closureSchedules } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getFoodItems(): Promise<FoodItem[]>;
  getFoodItem(id: number): Promise<FoodItem | undefined>;
  createFoodItem(item: InsertFoodItem): Promise<FoodItem>;
  updateFoodItem(id: number, updates: UpdateFoodItem): Promise<FoodItem | undefined>;
  deleteFoodItem(id: number): Promise<void>;
  
  getArchivedItems(): Promise<ArchivedItem[]>;
  createArchivedItem(item: InsertArchivedItem): Promise<ArchivedItem>;
  
  getClosureSchedules(): Promise<ClosureSchedule[]>;
  createClosureSchedule(schedule: InsertClosureSchedule): Promise<ClosureSchedule>;
  bulkCreateClosureSchedules(schedules: InsertClosureSchedule[]): Promise<ClosureSchedule[]>;
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

  async getArchivedItems(): Promise<ArchivedItem[]> {
    return await db.select().from(archivedItems);
  }

  async createArchivedItem(item: InsertArchivedItem): Promise<ArchivedItem> {
    const results = await db.insert(archivedItems).values(item).returning();
    return results[0];
  }

  async deleteArchivedItem(id: number): Promise<void> {
    await db.delete(archivedItems).where(eq(archivedItems.id, id));
  }

  async getClosureSchedules(): Promise<ClosureSchedule[]> {
    return await db.select().from(closureSchedules);
  }

  async createClosureSchedule(schedule: InsertClosureSchedule): Promise<ClosureSchedule> {
    const results = await db.insert(closureSchedules).values(schedule).returning();
    return results[0];
  }

  async bulkCreateClosureSchedules(schedules: InsertClosureSchedule[]): Promise<ClosureSchedule[]> {
    if (schedules.length === 0) return [];
    const results = await db.insert(closureSchedules).values(schedules).returning();
    return results;
  }
}

export const storage = new DatabaseStorage();
