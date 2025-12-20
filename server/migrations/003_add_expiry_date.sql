-- Add expiry_date column to food_items for tracking home item expiry
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS expiry_date TEXT;
