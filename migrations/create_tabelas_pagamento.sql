-- ============================================
-- MIGRAÇÃO: Criar Tabelas de Pagamento para Vistoriadores
-- Data: 2025-11-06
-- Descrição: Sistema de gerenciamento de pagamentos por período (diário/semanal/mensal)
-- ============================================

-- ============================================
-- PASSO 1: Criar ENUM para tipo de período
-- ============================================
DO $$ BEGIN
    CREATE TYPE periodo_tipo_pagamento AS ENUM (
        'DIARIO',
        'SEMANAL',
        'MENSAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PASSO 2: Criar ENUM para status de pagamento
-- ============================================
DO $$ BEGIN
    CREATE TYPE status_pagamento AS ENUM (
        'PENDENTE',
        'PAGO',
        'CANCELADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PASSO 3: Criar tabela de lotes de pagamento
-- ============================================
CREATE TABLE IF NOT EXISTS lotes_pagamento (
    id                    SERIAL PRIMARY KEY,
    vistoriador_id        INTEGER NOT NULL REFERENCES usuarios(id),
    periodo_tipo          periodo_tipo_pagamento NOT NULL DEFAULT 'MENSAL',
    data_inicio           DATE NOT NULL,
    data_fim              DATE NOT NULL,
    quantidade_vistorias  INTEGER NOT NULL DEFAULT 0,
    valor_total           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status                status_pagamento NOT NULL DEFAULT 'PENDENTE',
    data_pagamento        TIMESTAMP,
    forma_pagamento       VARCHAR(50),
    comprovante_url       VARCHAR(500),
    observacoes           TEXT,
    pago_por_id           INTEGER REFERENCES usuarios(id),
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_lotes_pagamento_vistoriador ON lotes_pagamento(vistoriador_id);
CREATE INDEX IF NOT EXISTS idx_lotes_pagamento_status ON lotes_pagamento(status);
CREATE INDEX IF NOT EXISTS idx_lotes_pagamento_periodo ON lotes_pagamento(data_inicio, data_fim);

-- Comentários
COMMENT ON TABLE lotes_pagamento IS 'Lotes de pagamento agrupados por período para vistoriadores';
COMMENT ON COLUMN lotes_pagamento.vistoriador_id IS 'ID do vistoriador que receberá o pagamento';
COMMENT ON COLUMN lotes_pagamento.periodo_tipo IS 'Tipo de período do lote (DIARIO, SEMANAL, MENSAL)';
COMMENT ON COLUMN lotes_pagamento.data_inicio IS 'Data de início do período';
COMMENT ON COLUMN lotes_pagamento.data_fim IS 'Data de fim do período';
COMMENT ON COLUMN lotes_pagamento.quantidade_vistorias IS 'Quantidade de vistorias incluídas neste lote';
COMMENT ON COLUMN lotes_pagamento.valor_total IS 'Valor total a pagar (soma de todas as vistorias do lote)';
COMMENT ON COLUMN lotes_pagamento.status IS 'Status do pagamento (PENDENTE, PAGO, CANCELADO)';
COMMENT ON COLUMN lotes_pagamento.data_pagamento IS 'Data em que o pagamento foi efetuado';
COMMENT ON COLUMN lotes_pagamento.forma_pagamento IS 'Forma de pagamento (PIX, TRANSFERENCIA, DINHEIRO, etc)';
COMMENT ON COLUMN lotes_pagamento.comprovante_url IS 'URL do comprovante de pagamento';
COMMENT ON COLUMN lotes_pagamento.observacoes IS 'Observações sobre o pagamento';
COMMENT ON COLUMN lotes_pagamento.pago_por_id IS 'ID do administrador que efetuou o pagamento';

-- ============================================
-- PASSO 4: Criar tabela de vinculação vistorias-lote
-- ============================================
CREATE TABLE IF NOT EXISTS vistorias_lote_pagamento (
    id                  SERIAL PRIMARY KEY,
    lote_pagamento_id   INTEGER NOT NULL REFERENCES lotes_pagamento(id) ON DELETE CASCADE,
    vistoria_id         INTEGER NOT NULL REFERENCES vistorias(id),
    valor_vistoriador   DECIMAL(10, 2) NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Garantir que uma vistoria não seja adicionada duas vezes ao mesmo lote
    UNIQUE(lote_pagamento_id, vistoria_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_vistorias_lote_lote ON vistorias_lote_pagamento(lote_pagamento_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_lote_vistoria ON vistorias_lote_pagamento(vistoria_id);

-- Comentários
COMMENT ON TABLE vistorias_lote_pagamento IS 'Vinculação entre vistorias e lotes de pagamento';
COMMENT ON COLUMN vistorias_lote_pagamento.lote_pagamento_id IS 'ID do lote de pagamento';
COMMENT ON COLUMN vistorias_lote_pagamento.vistoria_id IS 'ID da vistoria incluída no lote';
COMMENT ON COLUMN vistorias_lote_pagamento.valor_vistoriador IS 'Valor que o vistoriador receberá por esta vistoria';

-- ============================================
-- PASSO 5: Trigger para atualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_lotes_pagamento_updated_at ON lotes_pagamento;
CREATE TRIGGER update_lotes_pagamento_updated_at
    BEFORE UPDATE ON lotes_pagamento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vistorias_lote_pagamento_updated_at ON vistorias_lote_pagamento;
CREATE TRIGGER update_vistorias_lote_pagamento_updated_at
    BEFORE UPDATE ON vistorias_lote_pagamento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute para verificar se as tabelas foram criadas:
-- \dt lotes_pagamento
-- \dt vistorias_lote_pagamento
-- \d lotes_pagamento
-- \d vistorias_lote_pagamento

-- Verificar enums:
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'periodo_tipo_pagamento'::regtype;
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'status_pagamento'::regtype;

-- ============================================
-- DADOS DE TESTE (Opcional)
-- ============================================
-- Descomente para criar dados de teste:
/*
-- Exemplo: Criar lote de pagamento mensal para vistoriador ID 2
INSERT INTO lotes_pagamento (
    vistoriador_id, 
    periodo_tipo, 
    data_inicio, 
    data_fim,
    quantidade_vistorias,
    valor_total,
    status
) VALUES (
    2,                  -- ID do vistoriador
    'MENSAL',          -- Período mensal
    '2025-11-01',      -- Início: 01/11/2025
    '2025-11-30',      -- Fim: 30/11/2025
    0,                 -- Será atualizado ao vincular vistorias
    0.00,              -- Será atualizado ao vincular vistorias
    'PENDENTE'         -- Status inicial
);
*/

