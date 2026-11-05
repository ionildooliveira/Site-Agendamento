-- Migração 10: Coluna blocked_date para retrocompatibilidade total na tabela blocked_dates
-- Nota: 'GENERATED ALWAYS AS (date::text) STORED' falha com ERROR 42P17 (generation expression is not immutable)
-- porque date::text é STABLE no PostgreSQL (depende de DateStyle). A abordagem com coluna + trigger resolve:

ALTER TABLE blocked_dates
ADD COLUMN IF NOT EXISTS blocked_date TEXT;

UPDATE blocked_dates
SET blocked_date = date::text
WHERE blocked_date IS NULL;

CREATE OR REPLACE FUNCTION sync_blocked_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date IS NOT NULL THEN
    NEW.blocked_date := NEW.date::text;
  ELSIF NEW.blocked_date IS NOT NULL THEN
    NEW.date := NEW.blocked_date::date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_blocked_date ON blocked_dates;

CREATE TRIGGER trg_sync_blocked_date
BEFORE INSERT OR UPDATE ON blocked_dates
FOR EACH ROW
EXECUTE FUNCTION sync_blocked_date();
