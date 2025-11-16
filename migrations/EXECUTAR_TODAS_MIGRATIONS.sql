-- ============================================
-- SCRIPT CONSOLIDADO - TODAS AS MIGRATIONS
-- Execute este arquivo COMPLETO no seu banco de dados
-- ============================================

-- ============================================
-- MIGRATION 1: Campos do Proprietário (Embarcações)
-- ============================================
ALTER TABLE embarcacoes
  ADD COLUMN IF NOT EXISTS proprietario_cpf            CHAR(11),
  ADD COLUMN IF NOT EXISTS proprietario_telefone_e164  VARCHAR(20);

COMMENT ON COLUMN embarcacoes.proprietario_cpf IS 'CPF do proprietário (apenas dígitos)';
COMMENT ON COLUMN embarcacoes.proprietario_telefone_e164 IS 'Telefone do proprietário no formato E.164 (+5511999998888)';

-- ============================================
-- MIGRATION 2: Campos do Acompanhante (Vistorias)
-- ============================================
DO $$ BEGIN
    CREATE TYPE tipo_contato_acompanhante AS ENUM (
        'PROPRIETARIO',
        'MARINA',
        'TERCEIRO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE vistorias
  ADD COLUMN IF NOT EXISTS contato_acompanhante_tipo          tipo_contato_acompanhante,
  ADD COLUMN IF NOT EXISTS contato_acompanhante_nome          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contato_acompanhante_telefone_e164 VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contato_acompanhante_email         VARCHAR(255);

COMMENT ON COLUMN vistorias.contato_acompanhante_tipo IS 'Tipo de pessoa que acompanhará a vistoria';
COMMENT ON COLUMN vistorias.contato_acompanhante_nome IS 'Nome da pessoa que acompanhará a vistoria';
COMMENT ON COLUMN vistorias.contato_acompanhante_telefone_e164 IS 'Telefone do acompanhante no formato E.164';
COMMENT ON COLUMN vistorias.contato_acompanhante_email IS 'Email da pessoa que acompanhará a vistoria';

-- ============================================
-- MIGRATION 3: Campos Financeiros (Vistorias)
-- ============================================
ALTER TABLE vistorias
  ADD COLUMN IF NOT EXISTS valor_embarcacao   DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS valor_vistoria     DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS valor_vistoriador  DECIMAL(10, 2);

COMMENT ON COLUMN vistorias.valor_embarcacao IS 'Valor estimado da embarcação em R$';
COMMENT ON COLUMN vistorias.valor_vistoria IS 'Valor total da vistoria em R$';
COMMENT ON COLUMN vistorias.valor_vistoriador IS 'Valor a ser pago ao vistoriador em R$';

-- ============================================
-- MIGRATION 4: Tipo e Porte (Embarcações)
-- ============================================
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

ALTER TABLE embarcacoes
  ADD COLUMN IF NOT EXISTS tipo_embarcacao tipo_embarcacao_enum,
  ADD COLUMN IF NOT EXISTS porte            VARCHAR(50);

COMMENT ON COLUMN embarcacoes.tipo_embarcacao IS 'Tipo/categoria da embarcação';
COMMENT ON COLUMN embarcacoes.porte IS 'Porte da embarcação (ex: Pequeno, Médio, Grande)';

-- ============================================
-- MIGRATION 5: Sistema de Pagamentos
-- ============================================

-- Criar ENUM para tipo de período
DO $$ BEGIN
    CREATE TYPE periodo_tipo_pagamento AS ENUM (
        'DIARIO',
        'SEMANAL',
        'MENSAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar ENUM para status de pagamento
DO $$ BEGIN
    CREATE TYPE status_pagamento AS ENUM (
        'PENDENTE',
        'PAGO',
        'CANCELADO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de lotes de pagamento
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
COMMENT ON COLUMN lotes_pagamento.valor_total IS 'Valor total a pagar (soma de todas as vistorias)';
COMMENT ON COLUMN lotes_pagamento.status IS 'Status do pagamento (PENDENTE, PAGO, CANCELADO)';

-- Criar tabela de vinculação
CREATE TABLE IF NOT EXISTS vistorias_lote_pagamento (
    id                  SERIAL PRIMARY KEY,
    lote_pagamento_id   INTEGER NOT NULL REFERENCES lotes_pagamento(id) ON DELETE CASCADE,
    vistoria_id         INTEGER NOT NULL REFERENCES vistorias(id),
    valor_vistoriador   DECIMAL(10, 2) NOT NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(lote_pagamento_id, vistoria_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_vistorias_lote_lote ON vistorias_lote_pagamento(lote_pagamento_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_lote_vistoria ON vistorias_lote_pagamento(vistoria_id);

-- Comentários
COMMENT ON TABLE vistorias_lote_pagamento IS 'Vinculação entre vistorias e lotes de pagamento';

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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
-- VERIFICAÇÃO SISTEMA DE PAGAMENTOS
-- ============================================
SELECT 
    'Tabelas de pagamento criadas com sucesso!' as mensagem,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'lotes_pagamento') as lotes_pagamento,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'vistorias_lote_pagamento') as vistorias_lote_pagamento;

-- ============================================
-- MIGRATION 6: Sistema de Seguradoras
-- ============================================

-- Criar tabela de seguradoras
CREATE TABLE IF NOT EXISTS seguradoras (
    id                  SERIAL PRIMARY KEY,
    nome                VARCHAR(100) NOT NULL UNIQUE,
    ativo               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(seguradora_id, tipo_embarcacao)
);

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
-- POPULAR DADOS INICIAIS - SEGURADORAS
-- ============================================

-- Inserir seguradoras
INSERT INTO seguradoras (nome, ativo) VALUES
    ('Essor', TRUE),
    ('Mapfre', TRUE),
    ('Swiss RE', TRUE),
    ('AXA Seguros', TRUE),
    ('Fairfax', TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Inserir tipos de embarcação permitidos por seguradora

-- Essor: Lancha, Jet ski
INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao)
SELECT id, 'LANCHA' FROM seguradoras WHERE nome = 'Essor'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao)
SELECT id, 'JET_SKI' FROM seguradoras WHERE nome = 'Essor'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

-- Mapfre: Lancha, Embarcação Comercial
INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao)
SELECT id, 'LANCHA' FROM seguradoras WHERE nome = 'Mapfre'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao)
SELECT id, 'EMBARCACAO_COMERCIAL' FROM seguradoras WHERE nome = 'Mapfre'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

-- Swiss RE: Embarcação comercial
INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao)
SELECT id, 'EMBARCACAO_COMERCIAL' FROM seguradoras WHERE nome = 'Swiss RE'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

-- AXA Seguros: Embarcação Comercial
INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao)
SELECT id, 'EMBARCACAO_COMERCIAL' FROM seguradoras WHERE nome = 'AXA Seguros'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

-- Fairfax: Embarcação Comercial
INSERT INTO seguradora_tipo_embarcacao (seguradora_id, tipo_embarcacao)
SELECT id, 'EMBARCACAO_COMERCIAL' FROM seguradoras WHERE nome = 'Fairfax'
ON CONFLICT (seguradora_id, tipo_embarcacao) DO NOTHING;

-- ============================================
-- TRIGGERS SEGURADORAS
-- ============================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_seguradoras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_seguradoras_updated_at ON seguradoras;
CREATE TRIGGER trigger_seguradoras_updated_at
    BEFORE UPDATE ON seguradoras
    FOR EACH ROW
    EXECUTE FUNCTION update_seguradoras_updated_at();

-- ============================================
-- VERIFICAÇÃO SISTEMA DE SEGURADORAS
-- ============================================
SELECT 
    'Sistema de seguradoras criado com sucesso!' as mensagem,
    (SELECT COUNT(*) FROM seguradoras) as total_seguradoras,
    (SELECT COUNT(*) FROM seguradora_tipo_embarcacao) as total_tipos_permitidos;

-- ============================================
-- MIGRATION 7: Adicionar dados da Corretora nas Vistorias
-- ============================================

-- Adicionar campos de corretora na tabela vistorias
ALTER TABLE vistorias
  ADD COLUMN IF NOT EXISTS corretora_nome VARCHAR(255),
  ADD COLUMN IF NOT EXISTS corretora_telefone_e164 VARCHAR(20),
  ADD COLUMN IF NOT EXISTS corretora_email_laudo VARCHAR(255);

COMMENT ON COLUMN vistorias.corretora_nome IS 'Nome da corretora responsável';
COMMENT ON COLUMN vistorias.corretora_telefone_e164 IS 'Telefone de contato da corretora no formato E.164';
COMMENT ON COLUMN vistorias.corretora_email_laudo IS 'E-mail da corretora para envio do laudo';

-- ============================================
-- MIGRATION 8: Renomear numero_casco para nr_inscricao_barco
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
-- MIGRATION 9: Adicionar Valor e Ano na Embarcação
-- ============================================

-- Adicionar campos na tabela embarcacoes
ALTER TABLE embarcacoes
  ADD COLUMN IF NOT EXISTS valor_embarcacao DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS ano_fabricacao INTEGER;

COMMENT ON COLUMN embarcacoes.valor_embarcacao IS 'Valor estimado da embarcação em R$';
COMMENT ON COLUMN embarcacoes.ano_fabricacao IS 'Ano de fabricação da embarcação';

-- Adicionar constraint para ano (deve ser razoável)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_ano_fabricacao'
    ) THEN
        ALTER TABLE embarcacoes
        ADD CONSTRAINT check_ano_fabricacao 
        CHECK (ano_fabricacao IS NULL OR (ano_fabricacao >= 1900 AND ano_fabricacao <= 2100));
    END IF;
END $$;

-- ============================================
-- MIGRATION 10: Sistema de Clientes
-- ============================================

-- Criar ENUM para tipo de pessoa
DO $$ BEGIN
    CREATE TYPE tipo_pessoa AS ENUM ('FISICA', 'JURIDICA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id                      SERIAL PRIMARY KEY,
    tipo_pessoa             tipo_pessoa NOT NULL DEFAULT 'FISICA',
    nome                    VARCHAR(255) NOT NULL,
    cpf                     CHAR(11) UNIQUE,
    cnpj                    CHAR(14) UNIQUE,
    telefone_e164           VARCHAR(20),
    email                   VARCHAR(255),
    
    -- Endereço completo
    cep                     CHAR(8),
    logradouro              VARCHAR(255),
    numero                  VARCHAR(20),
    complemento             VARCHAR(100),
    bairro                  VARCHAR(100),
    cidade                  VARCHAR(100),
    estado                  CHAR(2),
    
    -- Observações
    observacoes             TEXT,
    ativo                   BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Garantir que tenha CPF OU CNPJ
    CONSTRAINT check_cpf_ou_cnpj CHECK (
        (tipo_pessoa = 'FISICA' AND cpf IS NOT NULL AND cnpj IS NULL) OR
        (tipo_pessoa = 'JURIDICA' AND cnpj IS NOT NULL AND cpf IS NULL)
    )
);

-- Comentários
COMMENT ON TABLE clientes IS 'Cadastro de clientes (pessoas físicas ou jurídicas)';
COMMENT ON COLUMN clientes.tipo_pessoa IS 'Tipo de pessoa: FISICA (CPF) ou JURIDICA (CNPJ)';
COMMENT ON COLUMN clientes.nome IS 'Nome completo (PF) ou Razão Social (PJ)';
COMMENT ON COLUMN clientes.cpf IS 'CPF (apenas dígitos) - obrigatório se tipo_pessoa = FISICA';
COMMENT ON COLUMN clientes.cnpj IS 'CNPJ (apenas dígitos) - obrigatório se tipo_pessoa = JURIDICA';
COMMENT ON COLUMN clientes.telefone_e164 IS 'Telefone no formato E.164 (+5511999998888)';
COMMENT ON COLUMN clientes.cep IS 'CEP (apenas dígitos)';
COMMENT ON COLUMN clientes.logradouro IS 'Rua/Avenida do endereço';
COMMENT ON COLUMN clientes.numero IS 'Número do imóvel';
COMMENT ON COLUMN clientes.complemento IS 'Complemento do endereço (apt, bloco, etc)';
COMMENT ON COLUMN clientes.bairro IS 'Bairro';
COMMENT ON COLUMN clientes.cidade IS 'Cidade';
COMMENT ON COLUMN clientes.estado IS 'Estado (UF)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON clientes(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_ativo ON clientes(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_cidade_estado ON clientes(cidade, estado);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_clientes_updated_at ON clientes;
CREATE TRIGGER trigger_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_clientes_updated_at();

-- ============================================
-- MIGRAR DADOS EXISTENTES
-- ============================================

-- Migrar proprietários de embarcações para clientes
INSERT INTO clientes (tipo_pessoa, nome, cpf, telefone_e164, email, ativo)
SELECT DISTINCT
    'FISICA'::tipo_pessoa as tipo_pessoa,
    COALESCE(proprietario_nome, 'Cliente Sem Nome') as nome,
    proprietario_cpf as cpf,
    proprietario_telefone_e164 as telefone_e164,
    proprietario_email as email,
    TRUE as ativo
FROM embarcacoes
WHERE proprietario_cpf IS NOT NULL
  AND proprietario_cpf != ''
  AND NOT EXISTS (
    SELECT 1 FROM clientes WHERE cpf = embarcacoes.proprietario_cpf
  )
ON CONFLICT (cpf) DO NOTHING;

-- Adicionar coluna cliente_id em embarcacoes
ALTER TABLE embarcacoes
  ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id);

COMMENT ON COLUMN embarcacoes.cliente_id IS 'ID do cliente proprietário da embarcação';

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_embarcacoes_cliente ON embarcacoes(cliente_id);

-- Vincular embarcações existentes aos clientes criados
UPDATE embarcacoes e
SET cliente_id = c.id
FROM clientes c
WHERE e.proprietario_cpf IS NOT NULL
  AND e.proprietario_cpf = c.cpf
  AND e.cliente_id IS NULL;

-- ============================================
-- MIGRATION 11: Sistema de Checklist de Fotos
-- ============================================

-- Criar ENUM para status do item do checklist
DO $$ BEGIN
    CREATE TYPE status_checklist_item AS ENUM ('PENDENTE', 'CONCLUIDO', 'NAO_APLICAVEL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela: Templates de Checklist
CREATE TABLE IF NOT EXISTS checklist_templates (
    id                  SERIAL PRIMARY KEY,
    tipo_embarcacao     VARCHAR(50) NOT NULL UNIQUE,
    nome                VARCHAR(255) NOT NULL,
    descricao           TEXT,
    ativo               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE checklist_templates IS 'Templates de checklist por tipo de embarcação';

-- Tabela: Itens dos Templates
CREATE TABLE IF NOT EXISTS checklist_template_itens (
    id                  SERIAL PRIMARY KEY,
    checklist_template_id INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    ordem               INTEGER NOT NULL,
    nome                VARCHAR(255) NOT NULL,
    descricao           TEXT,
    obrigatorio         BOOLEAN NOT NULL DEFAULT TRUE,
    permite_video       BOOLEAN NOT NULL DEFAULT FALSE,
    ativo               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(checklist_template_id, ordem)
);

COMMENT ON TABLE checklist_template_itens IS 'Itens dos templates de checklist';

-- Tabela: Checklist de cada Vistoria
CREATE TABLE IF NOT EXISTS vistoria_checklist_itens (
    id                  SERIAL PRIMARY KEY,
    vistoria_id         INTEGER NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
    template_item_id    INTEGER REFERENCES checklist_template_itens(id),
    ordem               INTEGER NOT NULL,
    nome                VARCHAR(255) NOT NULL,
    descricao           TEXT,
    obrigatorio         BOOLEAN NOT NULL DEFAULT TRUE,
    permite_video       BOOLEAN NOT NULL DEFAULT FALSE,
    status              status_checklist_item NOT NULL DEFAULT 'PENDENTE',
    foto_id             INTEGER REFERENCES fotos(id) ON DELETE SET NULL,
    observacao          TEXT,
    concluido_em        TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE vistoria_checklist_itens IS 'Itens do checklist de cada vistoria';

-- Índices
CREATE INDEX IF NOT EXISTS idx_checklist_templates_tipo ON checklist_templates(tipo_embarcacao);
CREATE INDEX IF NOT EXISTS idx_checklist_template_itens_template ON checklist_template_itens(checklist_template_id);
CREATE INDEX IF NOT EXISTS idx_vistoria_checklist_vistoria ON vistoria_checklist_itens(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_vistoria_checklist_status ON vistoria_checklist_itens(vistoria_id, status);

-- Triggers
DROP TRIGGER IF EXISTS trigger_vistoria_checklist_updated_at ON vistoria_checklist_itens;
CREATE TRIGGER trigger_vistoria_checklist_updated_at
    BEFORE UPDATE ON vistoria_checklist_itens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Popular Checklist JET_SKI
INSERT INTO checklist_templates (tipo_embarcacao, nome, descricao) VALUES ('JET_SKI', 'Checklist Padrão - Jet Ski', 'Sequência de fotos para vistoria de Jet Ski') ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_itens (checklist_template_id, ordem, nome, descricao, obrigatorio, permite_video) 
SELECT id, 1, 'Confirmação do nº de inscrição e nome', 'Foto mostrando claramente o número de inscrição e nome', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 2, 'Nome do acompanhante', 'Identificação da pessoa que acompanha a vistoria', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 3, 'Proa (frente)', 'Foto da parte frontal', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 4, 'Costado direito', 'Lateral direita completa', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 5, 'Costado esquerdo', 'Lateral esquerda completa', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 6, 'Modelo do jet', 'Foto do modelo/marca', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 7, 'Nome do jet', 'Nome/identificação lateral', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 8, 'Popa (traseira)', 'Parte traseira', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 9, 'Propulsão/rabeta', 'Sistema de propulsão', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 10, 'Nº de inscrição e capitania', 'Placa com número e capitania', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 11, 'Plaqueta do chassi', 'Plaqueta de identificação', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 12, 'Cockpit (visão geral)', 'Cockpit de cima: trás para frente', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 13, 'Painel de comando', 'Painel de instrumentos', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 14, 'Horas do motor', 'Horímetro mostrando horas de uso', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 15, 'Acionamento do motor', 'Foto/vídeo do RPM ligado ou propulsor funcionando', TRUE, TRUE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 16, 'Objetos extras', 'Âncora, coletes, retrovisor, CD player, etc', FALSE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 17, 'Vista geral do motor', 'Motor completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 18, 'Plaqueta do motor', 'Plaqueta de identificação do motor', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI' UNION ALL
SELECT id, 19, 'Documentos (TIE)', 'Documentos, principalmente TIE', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
ON CONFLICT DO NOTHING;

-- Popular Checklist LANCHA
INSERT INTO checklist_templates (tipo_embarcacao, nome, descricao) VALUES ('LANCHA', 'Checklist Padrão - Lancha', 'Sequência de fotos para vistoria de Lancha') ON CONFLICT DO NOTHING;

INSERT INTO checklist_template_itens (checklist_template_id, ordem, nome, descricao, obrigatorio, permite_video)
SELECT id, 1, 'Confirmação do nº de inscrição e nome', 'Número de inscrição e nome da lancha', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 2, 'Nome do acompanhante', 'Pessoa que acompanha a vistoria', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 3, 'Proa (frente)', 'Parte frontal', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 4, 'Âncora', 'Âncora e sistema de ancoragem', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 5, 'Costado direito', 'Lateral direita', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 6, 'Costado esquerdo', 'Lateral esquerda', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 7, 'Nome da lancha', 'Nome/identificação', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 8, 'Popa (traseira)', 'Parte traseira', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 9, 'Nº de inscrição e capitania', 'Placa com número e capitania', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 10, 'Plaqueta do casco/chassi', 'Plaqueta do casco', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 11, 'Objetos', 'Bandeira, defensas, guincho, estofarias', FALSE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 12, 'Painel de comando geral', 'Painel completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 13, 'Equipamentos do painel', 'Instrumentos e equipamentos', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 14, 'Acionamento do motor', 'Foto/vídeo do RPM ligado ou rabeta', TRUE, TRUE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 15, 'Horas do motor', 'Horímetro', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 16, 'Extintores + validade', 'Extintores com validade visível', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 17, 'Boias salva-vidas', 'Boias salva-vidas', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 18, 'Coletes salva-vidas', 'Coletes salva-vidas', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 19, 'Visão geral do motor', 'Motor completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 20, 'Bombas de porão', 'Bombas de porão', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 21, 'Bombas de água doce', 'Sistema de água doce', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 22, 'Baterias', 'Baterias', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 23, 'Plaqueta do motor/etiqueta', 'Plaqueta do motor', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA' UNION ALL
SELECT id, 24, 'Documentos (TIE)', 'Documentos, principalmente TIE', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION: Tabela de Laudos
-- ============================================

CREATE TABLE IF NOT EXISTS laudos (
    id SERIAL PRIMARY KEY,
    vistoria_id INTEGER NOT NULL UNIQUE,
    numero_laudo VARCHAR(50) NOT NULL UNIQUE,
    versao VARCHAR(20) DEFAULT 'BS 2021-01',
    
    nome_moto_aquatica VARCHAR(255),
    local_guarda TEXT,
    proprietario VARCHAR(255),
    cpf_cnpj VARCHAR(18),
    endereco_proprietario TEXT,
    responsavel VARCHAR(255),
    data_inspecao DATE,
    local_vistoria TEXT,
    empresa_prestadora VARCHAR(255),
    responsavel_inspecao VARCHAR(255),
    participantes_inspecao TEXT,
    
    inscricao_capitania VARCHAR(100),
    estaleiro_construtor VARCHAR(255),
    tipo_embarcacao VARCHAR(100),
    modelo_embarcacao VARCHAR(255),
    ano_fabricacao INTEGER,
    capacidade VARCHAR(100),
    classificacao_embarcacao VARCHAR(100),
    area_navegacao VARCHAR(100),
    situacao_capitania TEXT,
    valor_risco DECIMAL(12, 2),
    
    material_casco VARCHAR(100),
    observacoes_casco TEXT,
    
    quantidade_motores INTEGER,
    tipo_motor VARCHAR(100),
    fabricante_motor VARCHAR(255),
    modelo_motor VARCHAR(255),
    numero_serie_motor VARCHAR(255),
    potencia_motor VARCHAR(100),
    combustivel_utilizado VARCHAR(50),
    capacidade_tanque VARCHAR(50),
    ano_fabricacao_motor INTEGER,
    numero_helices VARCHAR(100),
    rabeta_reversora VARCHAR(100),
    blower VARCHAR(100),
    
    quantidade_baterias INTEGER,
    marca_baterias VARCHAR(100),
    capacidade_baterias VARCHAR(50),
    carregador_bateria VARCHAR(100),
    transformador VARCHAR(100),
    quantidade_geradores INTEGER,
    fabricante_geradores VARCHAR(255),
    tipo_modelo_geradores VARCHAR(255),
    capacidade_geracao VARCHAR(100),
    quantidade_bombas_porao INTEGER,
    fabricante_bombas_porao VARCHAR(255),
    modelo_bombas_porao VARCHAR(255),
    quantidade_bombas_agua_doce INTEGER,
    fabricante_bombas_agua_doce VARCHAR(255),
    modelo_bombas_agua_doce VARCHAR(255),
    observacoes_eletricos TEXT,
    
    guincho_eletrico VARCHAR(100),
    ancora VARCHAR(100),
    cabos VARCHAR(255),
    
    agulha_giroscopica VARCHAR(100),
    agulha_magnetica VARCHAR(100),
    antena VARCHAR(100),
    bidata VARCHAR(100),
    barometro VARCHAR(100),
    buzina VARCHAR(100),
    conta_giros VARCHAR(100),
    farol_milha VARCHAR(100),
    gps VARCHAR(100),
    higrometro VARCHAR(100),
    horimetro VARCHAR(100),
    limpador_parabrisa VARCHAR(100),
    manometros VARCHAR(100),
    odometro_fundo VARCHAR(100),
    passarela_embarque VARCHAR(100),
    piloto_automatico VARCHAR(100),
    psi VARCHAR(100),
    radar VARCHAR(100),
    radio_ssb VARCHAR(100),
    radio_vhf VARCHAR(100),
    radiogoniometro VARCHAR(100),
    sonda VARCHAR(100),
    speed_log VARCHAR(100),
    strobow VARCHAR(100),
    termometro VARCHAR(100),
    voltimetro VARCHAR(100),
    outros_equipamentos TEXT,
    
    extintores_automaticos VARCHAR(100),
    extintores_portateis VARCHAR(100),
    outros_incendio TEXT,
    atendimento_normas VARCHAR(100),
    
    acumulo_agua VARCHAR(100),
    avarias_casco VARCHAR(100),
    estado_geral_limpeza TEXT,
    teste_funcionamento_motor TEXT,
    funcionamento_bombas_porao TEXT,
    manutencao VARCHAR(100),
    observacoes_vistoria TEXT,
    
    checklist_eletrica JSONB,
    checklist_hidraulica JSONB,
    checklist_geral JSONB,
    
    logo_empresa_url VARCHAR(512),
    nome_empresa VARCHAR(255),
    nota_rodape TEXT,
    
    url_pdf VARCHAR(512),
    data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_laudos_vistoria FOREIGN KEY (vistoria_id) REFERENCES vistorias(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_laudos_vistoria_id ON laudos(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_laudos_numero_laudo ON laudos(numero_laudo);
CREATE INDEX IF NOT EXISTS idx_laudos_data_geracao ON laudos(data_geracao);

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_laudos_updated_at'
    ) THEN
        CREATE FUNCTION update_laudos_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END $$;

DROP TRIGGER IF EXISTS trigger_laudos_updated_at ON laudos;
CREATE TRIGGER trigger_laudos_updated_at
    BEFORE UPDATE ON laudos
    FOR EACH ROW
    EXECUTE FUNCTION update_laudos_updated_at();

COMMENT ON TABLE laudos IS 'Armazena dados completos dos laudos de vistoria náutica';
COMMENT ON COLUMN laudos.numero_laudo IS 'Número único do laudo no formato AAMMDDX';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 
    'Todas as migrations executadas com sucesso!' as mensagem,
    (SELECT COUNT(*) FROM clientes) as total_clientes,
    (SELECT COUNT(*) FROM embarcacoes WHERE cliente_id IS NOT NULL) as embarcacoes_vinculadas,
    (SELECT COUNT(*) FROM checklist_templates) as total_checklists,
    (SELECT COUNT(*) FROM checklist_template_itens) as total_itens_checklist,
    (SELECT COUNT(*) FROM laudos) as total_laudos;

