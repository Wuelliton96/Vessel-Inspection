-- migrations/add_tipo_porte_embarcacoes.sql
-- Script para adicionar tipo e porte na tabela de embarcações
-- Data: 06/11/2025

-- Criar tipo ENUM para tipo_embarcacao (se ainda não existir)
DO $$ BEGIN
    CREATE TYPE tipo_embarcacao_enum AS ENUM (
        'JET_SKI',
        'BALSA',
        'IATE',
        'VELEIRO',
        'REBOCADOR',
        'EMPURRADOR',
        'LANCHA',
        'BARCO',
        'OUTRO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas na tabela embarcacoes
ALTER TABLE embarcacoes
  ADD COLUMN IF NOT EXISTS tipo_embarcacao tipo_embarcacao_enum,
  ADD COLUMN IF NOT EXISTS porte            VARCHAR(50);

-- Adicionar comentários para documentação
COMMENT ON COLUMN embarcacoes.tipo_embarcacao IS 'Tipo/categoria da embarcação (Jet Ski, Balsa, Iate, etc.)';
COMMENT ON COLUMN embarcacoes.porte IS 'Porte da embarcação (Pequeno, Médio, Grande ou tamanho em metros)';

-- Verificar se as colunas foram adicionadas
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'embarcacoes' 
  AND column_name IN ('tipo_embarcacao', 'porte')
ORDER BY column_name;

-- Exemplo de uso:
-- UPDATE embarcacoes SET 
--   tipo_embarcacao = 'IATE',
--   porte = 'GRANDE'
-- WHERE id = 1;

