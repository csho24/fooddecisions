import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const openingHoursSchema = z.object({
  open: z.string(),
  close: z.string(),
});

export const locationDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.string().optional(),
  openingHours: openingHoursSchema.optional(),
  closedDays: z.array(z.number()).optional(),
});

export const foodItems = pgTable("food_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'home' | 'out'
  category: text("category"),
  notes: text("notes"),
  locations: jsonb("locations").$type<{
    id: string;
    name: string;
    notes?: string;
    openingHours?: { open: string; close: string };
    closedDays?: number[];
  }[]>(),
});

export const insertFoodItemSchema = createInsertSchema(foodItems, {
  name: z.string().min(2, "Name is required"),
  type: z.enum(['home', 'out']),
  locations: z.array(locationDetailSchema).optional(),
}).omit({ id: true });

export const updateFoodItemSchema = insertFoodItemSchema.partial();

export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type UpdateFoodItem = z.infer<typeof updateFoodItemSchema>;
export type FoodItem = typeof foodItems.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
