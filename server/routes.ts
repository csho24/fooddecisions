import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFoodItemSchema, updateFoodItemSchema, insertArchivedItemSchema } from "@shared/schema";
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
      console.error("Error fetching food items:", error);
      res.status(500).json({ error: "Failed to fetch food items", details: error instanceof Error ? error.message : String(error) });
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
      console.error("Error creating food item:", error);
      res.status(500).json({ error: "Failed to create food item", details: error instanceof Error ? error.message : String(error) });
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

  app.get("/api/archives", async (req, res) => {
    try {
      const items = await storage.getArchivedItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching archived items:", error);
      res.status(500).json({ error: "Failed to fetch archived items", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/archives", async (req, res) => {
    try {
      const validation = insertArchivedItemSchema.safeParse(req.body);
      if (!validation.success) {
        const error = fromZodError(validation.error);
        return res.status(400).json({ error: error.message });
      }
      
      const item = await storage.createArchivedItem(validation.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating archived item:", error);
      res.status(500).json({ error: "Failed to create archived item", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/archives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteArchivedItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete archived item" });
    }
  });

  return httpServer;
}
