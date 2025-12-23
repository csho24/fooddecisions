-- Migration: Add categories table and foodCategory column
-- Run this migration on your Neon database

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);

-- Add foodCategory column to food_items table
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS food_category TEXT;

-- Insert initial categories
INSERT INTO categories (name) VALUES 
  ('Noodles'),
  ('Rice'),
  ('Ethnic'),
  ('Light'),
  ('Western')
ON CONFLICT (name) DO NOTHING;






