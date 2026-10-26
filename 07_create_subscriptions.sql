-- Migration 07: Subscriptions and Recurring Payments Table
-- Execute this script in your Supabase SQL Editor if you wish to persist subscriptions in a dedicated table.

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_cpf TEXT,
  user_phone TEXT,
  plan_name TEXT DEFAULT 'Plano Profissional',
  amount NUMERIC(10, 2) NOT NULL DEFAULT 49.90,
  billing_cycle TEXT DEFAULT 'monthly',
  payment_method TEXT NOT NULL, -- 'credit_card', 'debit_card', 'pix'
  payment_status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected', 'cancelled'
  auto_recurring BOOLEAN DEFAULT TRUE,
  mp_payment_id TEXT,
  mp_preapproval_id TEXT,
  mp_status TEXT,
  mp_qr_code TEXT,
  mp_qr_code_base64 TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(payment_status);
