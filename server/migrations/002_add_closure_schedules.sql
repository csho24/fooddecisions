-- Migration: Add closure_schedules table
-- Run this migration on your Neon database

CREATE TABLE IF NOT EXISTS closure_schedules (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('cleaning', 'timeoff')),
  date TEXT NOT NULL,
  location TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);

-- Create index for faster lookups by date
CREATE INDEX IF NOT EXISTS idx_closure_schedules_date ON closure_schedules(date);

-- Create index for faster lookups by type
CREATE INDEX IF NOT EXISTS idx_closure_schedules_type ON closure_schedules(type);






