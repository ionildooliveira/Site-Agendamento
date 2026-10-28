-- ==============================================================================
-- Migração 08: Ativação de Row Level Security (RLS) e Blindagem de Dados no Supabase
-- Execute este script no SQL Editor do painel do Supabase.
-- ==============================================================================

-- 1. Habilitar RLS em todas as tabelas públicas da aplicação
ALTER TABLE IF EXISTS admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas legadas caso existam
DROP POLICY IF EXISTS "Deny all public on admin_users" ON admin_users;
DROP POLICY IF EXISTS "Deny all public on clients" ON clients;
DROP POLICY IF EXISTS "Deny all public on bookings" ON bookings;
DROP POLICY IF EXISTS "Deny all public on settings" ON settings;
DROP POLICY IF EXISTS "Deny all public on subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Deny all public on blocked_dates" ON blocked_dates;

-- 3. Definir regras estritas: Bloqueio total de acesso direto via API PostgREST pública (anon)
-- O backend Node.js conecta utilizando a chave "service_role", a qual possui privilégios
-- de superusuário e bypass automático de RLS, mantendo o funcionamento do servidor 100% íntegro.

-- Tabelas extremamente sensíveis: NENHUM acesso direto para chave pública (anon)
-- (Tudo deve passar pelo backend Node.js que valida JWT e regras de negócio)

-- admin_users: Nenhum acesso público direto
CREATE POLICY "Deny all public on admin_users" ON admin_users
  FOR ALL
  TO anon, authenticated
  USING (false);

-- clients: Nenhum acesso público direto (proteção LGPD)
CREATE POLICY "Deny all public on clients" ON clients
  FOR ALL
  TO anon, authenticated
  USING (false);

-- bookings: Nenhum acesso público direto (proteção LGPD contra scraping de agendamentos)
CREATE POLICY "Deny all public on bookings" ON bookings
  FOR ALL
  TO anon, authenticated
  USING (false);

-- settings: Nenhum acesso público direto
CREATE POLICY "Deny all public on settings" ON settings
  FOR ALL
  TO anon, authenticated
  USING (false);

-- subscriptions: Bloqueio total (contém CPF, telefone, valores e identificadores de pagamento)
CREATE POLICY "Deny all public on subscriptions" ON subscriptions
  FOR ALL
  TO anon, authenticated
  USING (false);

-- blocked_dates: Bloqueio total para escrita direta
CREATE POLICY "Deny all public on blocked_dates" ON blocked_dates
  FOR ALL
  TO anon, authenticated
  USING (false);

-- 4. Tabelas de Catálogo Público (Apenas Leitura de dados ativos, caso a API direta do Supabase seja consultada)
DROP POLICY IF EXISTS "Allow public read active companies" ON companies;
CREATE POLICY "Allow public read active companies" ON companies
  FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow public read active services" ON services;
CREATE POLICY "Allow public read active services" ON services
  FOR SELECT
  TO anon
  USING (active = true);

DROP POLICY IF EXISTS "Allow public read active professionals" ON professionals;
CREATE POLICY "Allow public read active professionals" ON professionals
  FOR SELECT
  TO anon
  USING (active = true);

DROP POLICY IF EXISTS "Allow public read approved testimonials" ON testimonials;
CREATE POLICY "Allow public read approved testimonials" ON testimonials
  FOR SELECT
  TO anon
  USING (status = 'approved');

DROP POLICY IF EXISTS "Allow public read gallery" ON gallery_images;
CREATE POLICY "Allow public read gallery" ON gallery_images
  FOR SELECT
  TO anon
  USING (true);

-- Notificação de sucesso
COMMENT ON TABLE admin_users IS 'Protegido com RLS ativo. Acesso exclusivo via backend service_role.';
