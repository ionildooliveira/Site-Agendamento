-- Remove global unique constraint on email
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_email_key;

-- Add composite unique constraint for multitenant
ALTER TABLE clients ADD CONSTRAINT clients_email_company_id_key UNIQUE (email, company_id);
