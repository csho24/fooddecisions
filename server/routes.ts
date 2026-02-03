import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFoodItemSchema, updateFoodItemSchema, insertArchivedItemSchema, insertClosureScheduleSchema } from "@shared/schema";
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

  app.get("/api/closures", async (req, res) => {
    try {
      const schedules = await storage.getClosureSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching closure schedules:", error);
      res.status(500).json({ error: "Failed to fetch closure schedules", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/closures", async (req, res) => {
    try {
      const { schedules } = req.body;
      
      if (Array.isArray(schedules)) {
        // Bulk create
        const validations = schedules.map(s => insertClosureScheduleSchema.safeParse(s));
        const invalidIdx = validations.findIndex(v => !v.success);
        if (invalidIdx !== -1) {
          const error = fromZodError(validations[invalidIdx].error!);
          return res.status(400).json({ error: error.message });
        }
        
        const validatedSchedules = validations.map(v => v.data!);
        const created = await storage.bulkCreateClosureSchedules(validatedSchedules);
        return res.status(201).json(created);
      } else {
        // Single create
        const validation = insertClosureScheduleSchema.safeParse(req.body);
        if (!validation.success) {
          const error = fromZodError(validation.error);
          return res.status(400).json({ error: error.message });
        }
        
        const schedule = await storage.createClosureSchedule(validation.data);
        return res.status(201).json(schedule);
      }
    } catch (error) {
      console.error("Error creating closure schedule:", error);
      res.status(500).json({ error: "Failed to create closure schedule", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/closures/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: "Invalid closure id" });
      }
      await storage.deleteClosureSchedule(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting closure schedule:", error);
      res.status(500).json({ error: "Failed to delete closure schedule", details: error instanceof Error ? error.message : String(error) });
    }
  });

  return httpServer;
}
