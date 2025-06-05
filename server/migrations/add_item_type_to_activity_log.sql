-- Primeiro, adicionamos a coluna sem a restrição NOT NULL
ALTER TABLE activity_log ADD COLUMN item_type TEXT;

-- Atualizamos os registros existentes
UPDATE activity_log SET item_type = 'paletizado' WHERE item_type IS NULL;

-- Agora adicionamos a restrição NOT NULL
ALTER TABLE activity_log ALTER COLUMN item_type SET NOT NULL; 