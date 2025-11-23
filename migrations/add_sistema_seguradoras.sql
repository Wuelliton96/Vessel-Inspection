-- ============================================
-- MIGRATION: Sistema de Seguradoras
-- Descrição: Adiciona tabelas de seguradoras e relacionamento com tipos de embarcação
-- ============================================

-- Criar tabela de seguradoras
CREATE TABLE IF NOT EXISTS seguradoras (
    id                  SERIAL PRIMARY KEY,
    nome                VARCHAR(100) NOT NULL UNIQUE,
    ativo               BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt"         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Garantir que as colunas createdAt e updatedAt tenham DEFAULT mesmo se a tabela já existir
ALTER TABLE seguradoras 
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Se as colunas não existirem, criar (para tabelas antigas)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seguradoras' AND column_name = 'createdAt') THEN
        ALTER TABLE seguradoras ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seguradoras' AND column_name = 'updatedAt') THEN
        ALTER TABLE seguradoras ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

COMMENT ON TABLE seguradoras IS 'Cadastro de seguradoras';
COMMENT ON COLUMN seguradoras.nome IS 'Nome da seguradora';
COMMENT ON COLUMN seguradoras.ativo IS 'Indica se a seguradora está ativa';

-- Criar ENUM para tipos de embarcação (expandido)
DO $$ BEGIN
    CREATE TYPE tipo_embarcacao_seguradora AS ENUM (
        'LANCHA',
        'JET_SKI',
        'EMBARCACAO_COMERCIAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de relacionamento Seguradora <-> Tipo de Embarcação
CREATE TABLE IF NOT EXISTS seguradora_tipo_embarcacao (
    id                  SERIAL PRIMARY KEY,
    seguradora_id       INTEGER NOT NULL REFERENCES seguradoras(id) ON DELETE CASCADE,
    tipo_embarcacao     tipo_embarcacao_seguradora NOT NULL,
    "createdAt"         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(seguradora_id, tipo_embarcacao)
);

-- Garantir que as colunas createdAt e updatedAt tenham DEFAULT mesmo se a tabela já existir
ALTER TABLE seguradora_tipo_embarcacao 
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- Se as colunas não existirem, criar (para tabelas antigas)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seguradora_tipo_embarcacao' AND column_name = 'createdAt') THEN
        ALTER TABLE seguradora_tipo_embarcacao ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seguradora_tipo_embarcacao' AND column_name = 'updatedAt') THEN
        ALTER TABLE seguradora_tipo_embarcacao ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

COMMENT ON TABLE seguradora_tipo_embarcacao IS 'Tipos de embarcação permitidos por cada seguradora';

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_seguradora_tipo_seguradora ON seguradora_tipo_embarcacao(seguradora_id);
CREATE INDEX IF NOT EXISTS idx_seguradoras_ativo ON seguradoras(ativo);

-- Adicionar campo seguradora_id na tabela embarcacoes
ALTER TABLE embarcacoes
  ADD COLUMN IF NOT EXISTS seguradora_id INTEGER REFERENCES seguradoras(id);

COMMENT ON COLUMN embarcacoes.seguradora_id IS 'Seguradora responsável pela embarcação';

-- Índice para seguradora_id
CREATE INDEX IF NOT EXISTS idx_embarcacoes_seguradora ON embarcacoes(seguradora_id);

-- ============================================
-- POPULAR DADOS INICIAIS
-- ============================================

-- Inserir seguradoras (com createdAt e updatedAt explícitos para garantir)
INSERT INTO seguradoras (nome, ativo, "createdAt", "updatedAt") VALUES
    ('Essor', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Mapfre', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Swiss RE', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('AXA Seguros', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Fairfax', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (nome) DO NOTHING;

-- Inserir tipos de embarcação permitidos por seguradora

-- Essor: Lancha, Jet ski
INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao, "createdAt", "updatedAt")
SELECT id, 'LANCHA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM seguradoras WHERE nome = 'Essor'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao, "createdAt", "updatedAt")
SELECT id, 'JET_SKI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM seguradoras WHERE nome = 'Essor'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

-- Mapfre: Lancha, Embarcação Comercial
INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao, "createdAt", "updatedAt")
SELECT id, 'LANCHA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM seguradoras WHERE nome = 'Mapfre'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao, "createdAt", "updatedAt")
SELECT id, 'EMBARCACAO_COMERCIAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM seguradoras WHERE nome = 'Mapfre'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

-- Swiss RE: Embarcação comercial
INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao, "createdAt", "updatedAt")
SELECT id, 'EMBARCACAO_COMERCIAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM seguradoras WHERE nome = 'Swiss RE'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

-- AXA Seguros: Embarcação Comercial
INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao, "createdAt", "updatedAt")
SELECT id, 'EMBARCACAO_COMERCIAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM seguradoras WHERE nome = 'AXA Seguros'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

-- Fairfax: Embarcação Comercial
INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao, "createdAt", "updatedAt")
SELECT id, 'EMBARCACAO_COMERCIAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM seguradoras WHERE nome = 'Fairfax'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_seguradoras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_seguradoras_updated_at ON seguradoras;
CREATE TRIGGER trigger_seguradoras_updated_at
    BEFORE UPDATE ON seguradoras
    FOR EACH ROW
    EXECUTE FUNCTION update_seguradoras_updated_at();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    'Sistema de Seguradoras criado com sucesso!' as mensagem,
    (SELECT COUNT(*) FROM seguradoras) as total_seguradoras,
    (SELECT COUNT(*) FROM seguradora_tipo_embarcacao) as total_tipos_permitidos;


