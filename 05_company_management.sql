-- Migration: Company Management
-- Add is_active column to companies and update foreign keys to ON DELETE CASCADE

-- 1. Add is_active column
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Update foreign keys to use ON DELETE CASCADE
-- We need to drop the existing constraints and recreate them

-- admin_users
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_company_id_fkey;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- clients
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_company_id_fkey;
ALTER TABLE clients ADD CONSTRAINT clients_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- professionals
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_company_id_fkey;
ALTER TABLE professionals ADD CONSTRAINT professionals_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- services
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_company_id_fkey;
ALTER TABLE services ADD CONSTRAINT services_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_company_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- settings
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_company_id_fkey;
ALTER TABLE settings ADD CONSTRAINT settings_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- blocked_dates
ALTER TABLE blocked_dates DROP CONSTRAINT IF EXISTS blocked_dates_company_id_fkey;
ALTER TABLE blocked_dates ADD CONSTRAINT blocked_dates_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- testimonials (links to bookings, so we cascade it too)
ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_booking_id_fkey;
ALTER TABLE testimonials ADD CONSTRAINT testimonials_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
