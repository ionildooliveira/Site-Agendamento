-- Add is_active column to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update foreign keys to use ON DELETE CASCADE
-- We need to drop the existing foreign keys and add them again with ON DELETE CASCADE.
-- Assuming standard naming conventions for foreign keys in Supabase/PostgreSQL.

-- Admin Users
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_company_id_fkey;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Clients
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_company_id_fkey;
ALTER TABLE clients ADD CONSTRAINT clients_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Professionals
ALTER TABLE professionals DROP CONSTRAINT IF EXISTS professionals_company_id_fkey;
ALTER TABLE professionals ADD CONSTRAINT professionals_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Services
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_company_id_fkey;
ALTER TABLE services ADD CONSTRAINT services_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_company_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Settings
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_company_id_fkey;
ALTER TABLE settings ADD CONSTRAINT settings_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Blocked Dates
ALTER TABLE blocked_dates DROP CONSTRAINT IF EXISTS blocked_dates_company_id_fkey;
ALTER TABLE blocked_dates ADD CONSTRAINT blocked_dates_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Testimonials
ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS testimonials_company_id_fkey;
ALTER TABLE testimonials ADD CONSTRAINT testimonials_company_id_fkey 
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
