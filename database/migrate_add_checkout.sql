-- Bancos criados com init.sql antigo (sem saída). Ver comando no README.
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMPTZ NULL;
