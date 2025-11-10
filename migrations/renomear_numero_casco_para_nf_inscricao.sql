-- ============================================
-- MIGRATION: Renomear numero_casco para nr_inscricao_barco
-- Descrição: Altera nomenclatura de numero_casco para Nr de Inscrição do Barco
-- ============================================

-- Renomear coluna (se não foi renomeada ainda)
DO $$ 
BEGIN
    -- Verifica se a coluna numero_casco existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'embarcacoes' AND column_name = 'numero_casco'
    ) THEN
        -- Renomeia a coluna
        ALTER TABLE embarcacoes RENAME COLUMN numero_casco TO nr_inscricao_barco;
        RAISE NOTICE 'Coluna numero_casco renomeada para nr_inscricao_barco';
    ELSE
        RAISE NOTICE 'Coluna nr_inscricao_barco já existe, migration já foi executada';
    END IF;
END $$;

-- Atualizar comentário
COMMENT ON COLUMN embarcacoes.nr_inscricao_barco IS 'Número de Inscrição do Barco';

-- Atualizar constraint/índice unique se necessário
DO $$
BEGIN
    -- Remove constraint antiga se existir
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'embarcacoes_numero_casco_key') THEN
        ALTER TABLE embarcacoes DROP CONSTRAINT embarcacoes_numero_casco_key;
    END IF;
    
    -- Cria novo índice unique
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'embarcacoes_nr_inscricao_barco_key') THEN
        CREATE UNIQUE INDEX embarcacoes_nr_inscricao_barco_key ON embarcacoes(nr_inscricao_barco);
    END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    'Coluna renomeada com sucesso!' as mensagem,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'embarcacoes' AND column_name = 'nr_inscricao_barco') as nr_inscricao_barco_existe,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'embarcacoes' AND column_name = 'numero_casco') as numero_casco_existe;

