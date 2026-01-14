-- Migration: Add food_item columns to closure_schedules
-- Run this migration on your Neon database

ALTER TABLE closure_schedules 
ADD COLUMN IF NOT EXISTS food_item_id TEXT;

ALTER TABLE closure_schedules 
ADD COLUMN IF NOT EXISTS food_item_name TEXT;
