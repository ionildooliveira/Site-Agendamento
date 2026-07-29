-- Add salon_data column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS salon_data JSONB;
