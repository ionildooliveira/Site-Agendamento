-- Migration: Multi-Tenant Architecture
-- Run this in your Supabase SQL Editor

-- 1. Create the companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert a default company for existing data
-- We use a fixed UUID so we can easily link existing records.
INSERT INTO companies (id, name, slug) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Studio Beauty', 'studio-beauty')
ON CONFLICT (id) DO NOTHING;

-- 3. Add company_id to existing tables (with default to the first company)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE services ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS salon_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE blocked_dates ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) DEFAULT '11111111-1111-1111-1111-111111111111';

-- Merge old settings id=2 (salon data) into id=1, then delete id=2
UPDATE settings SET salon_data = (SELECT working_hours::jsonb FROM settings WHERE id = 2) WHERE id = 1 AND EXISTS (SELECT 1 FROM settings WHERE id = 2);
DELETE FROM settings WHERE id = 2;

-- 4. Remove default values so future inserts require a company_id
ALTER TABLE admin_users ALTER COLUMN company_id DROP DEFAULT;
ALTER TABLE clients ALTER COLUMN company_id DROP DEFAULT;
ALTER TABLE professionals ALTER COLUMN company_id DROP DEFAULT;
ALTER TABLE services ALTER COLUMN company_id DROP DEFAULT;
ALTER TABLE bookings ALTER COLUMN company_id DROP DEFAULT;
ALTER TABLE settings ALTER COLUMN company_id DROP DEFAULT;
ALTER TABLE blocked_dates ALTER COLUMN company_id DROP DEFAULT;
