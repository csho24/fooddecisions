import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFoodItemSchema, updateFoodItemSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/foods", async (req, res) => {
    try {
      const items = await storage.getFoodItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch food items" });
    }
  });

  app.get("/api/foods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getFoodItem(id);
      if (!item) {
        return res.status(404).json({ error: "Food item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch food item" });
    }
  });

  app.post("/api/foods", async (req, res) => {
    try {
      const validation = insertFoodItemSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const item = await storage.createFoodItem(validation.data);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create food item" });
    }
  });

  app.patch("/api/foods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = updateFoodItemSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const item = await storage.updateFoodItem(id, validation.data);
      if (!item) {
        return res.status(404).json({ error: "Food item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update food item" });
    }
  });

  app.delete("/api/foods/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFoodItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete food item" });
    }
  });

  return httpServer;
}
