-- ==============================================================================
-- Migração 09: Conceder Acesso Total ao service_role (Backend Node.js)
-- Execute este script no SQL Editor do Supabase.
-- ==============================================================================

-- 1. Assegurar que nenhuma empresa antiga fique com is_active NULL
UPDATE companies SET is_active = TRUE WHERE is_active IS NULL;

-- 2. Conceder permissão total (SELECT, INSERT, UPDATE, DELETE) para a role 'service_role'
-- Isso garante que o backend Node.js tenha acesso irrestrito enquanto 'anon' continua bloqueado.

DROP POLICY IF EXISTS "Service role full access" ON admin_users;
CREATE POLICY "Service role full access" ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON clients;
CREATE POLICY "Service role full access" ON clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON professionals;
CREATE POLICY "Service role full access" ON professionals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON services;
CREATE POLICY "Service role full access" ON services
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON bookings;
CREATE POLICY "Service role full access" ON bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON settings;
CREATE POLICY "Service role full access" ON settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON blocked_dates;
CREATE POLICY "Service role full access" ON blocked_dates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON companies;
CREATE POLICY "Service role full access" ON companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON testimonials;
CREATE POLICY "Service role full access" ON testimonials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON gallery_images;
CREATE POLICY "Service role full access" ON gallery_images
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON subscriptions;
CREATE POLICY "Service role full access" ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
