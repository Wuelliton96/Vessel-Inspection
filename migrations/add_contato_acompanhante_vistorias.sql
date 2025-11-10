-- ============================================
-- MIGRAÇÃO: Adicionar Campos de Contato/Acompanhante em Vistorias
-- Data: 2025-01-06
-- Descrição: Adiciona campos para identificar quem acompanhará a vistoria
-- ============================================

-- Criar ENUM para tipo de acompanhante (se não existir)
DO $$ BEGIN
    CREATE TYPE tipo_contato_acompanhante AS ENUM (
        'PROPRIETARIO',  -- O próprio proprietário da embarcação
        'MARINA',        -- Representante da marina
        'TERCEIRO'       -- Outra pessoa designada
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas de contato/acompanhante
ALTER TABLE vistorias
  ADD COLUMN IF NOT EXISTS contato_acompanhante_tipo          tipo_contato_acompanhante,
  ADD COLUMN IF NOT EXISTS contato_acompanhante_nome          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contato_acompanhante_telefone_e164 VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contato_acompanhante_email         VARCHAR(255);

-- Adicionar comentários para documentação
COMMENT ON COLUMN vistorias.contato_acompanhante_tipo IS 'Tipo de pessoa que acompanhará a vistoria (PROPRIETARIO, MARINA ou TERCEIRO)';
COMMENT ON COLUMN vistorias.contato_acompanhante_nome IS 'Nome da pessoa que acompanhará a vistoria';
COMMENT ON COLUMN vistorias.contato_acompanhante_telefone_e164 IS 'Telefone do acompanhante no formato E.164 (+5511999998888)';
COMMENT ON COLUMN vistorias.contato_acompanhante_email IS 'Email da pessoa que acompanhará a vistoria';

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute para verificar se as colunas foram adicionadas:
-- SELECT column_name, data_type, udt_name
-- FROM information_schema.columns 
-- WHERE table_name = 'vistorias' 
--   AND column_name LIKE 'contato_acompanhante%';

