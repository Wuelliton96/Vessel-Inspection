-- ============================================
-- MIGRATION: Sistema de Checklist de Fotos
-- Descrição: Cria sistema completo de checklist editável por tipo de embarcação
-- ============================================

-- Criar ENUM para status do item do checklist
DO $$ BEGIN
    CREATE TYPE status_checklist_item AS ENUM ('PENDENTE', 'CONCLUIDO', 'NAO_APLICAVEL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela: Templates de Checklist (um por tipo de embarcação)
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
COMMENT ON COLUMN checklist_templates.tipo_embarcacao IS 'Tipo de embarcação (JET_SKI, LANCHA, etc)';
COMMENT ON COLUMN checklist_templates.nome IS 'Nome do checklist';

-- Tabela: Itens dos Templates de Checklist
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

COMMENT ON TABLE checklist_template_itens IS 'Itens individuais de cada template de checklist';
COMMENT ON COLUMN checklist_template_itens.ordem IS 'Ordem de exibição do item no checklist';
COMMENT ON COLUMN checklist_template_itens.nome IS 'Nome curto do item (ex: Proa, Popa, Nº de inscrição)';
COMMENT ON COLUMN checklist_template_itens.descricao IS 'Descrição detalhada/instruções';
COMMENT ON COLUMN checklist_template_itens.obrigatorio IS 'Se a foto é obrigatória para aprovar vistoria';
COMMENT ON COLUMN checklist_template_itens.permite_video IS 'Se permite vídeo ao invés de foto';

-- Tabela: Checklist de Vistoria (cópia do template para cada vistoria)
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

COMMENT ON TABLE vistoria_checklist_itens IS 'Itens do checklist específicos de cada vistoria';
COMMENT ON COLUMN vistoria_checklist_itens.template_item_id IS 'Referência ao item do template (pode ser null se customizado)';
COMMENT ON COLUMN vistoria_checklist_itens.status IS 'Status do item (PENDENTE, CONCLUIDO, NAO_APLICAVEL)';
COMMENT ON COLUMN vistoria_checklist_itens.foto_id IS 'ID da foto vinculada a este item';
COMMENT ON COLUMN vistoria_checklist_itens.concluido_em IS 'Data/hora que o item foi marcado como concluído';

-- Índices
CREATE INDEX IF NOT EXISTS idx_checklist_templates_tipo ON checklist_templates(tipo_embarcacao);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_ativo ON checklist_templates(ativo);
CREATE INDEX IF NOT EXISTS idx_checklist_template_itens_template ON checklist_template_itens(checklist_template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_template_itens_ordem ON checklist_template_itens(checklist_template_id, ordem);
CREATE INDEX IF NOT EXISTS idx_vistoria_checklist_vistoria ON vistoria_checklist_itens(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_vistoria_checklist_status ON vistoria_checklist_itens(vistoria_id, status);
CREATE INDEX IF NOT EXISTS idx_vistoria_checklist_foto ON vistoria_checklist_itens(foto_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_checklist_templates_updated_at ON checklist_templates;
CREATE TRIGGER trigger_checklist_templates_updated_at
    BEFORE UPDATE ON checklist_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_checklist_updated_at();

DROP TRIGGER IF EXISTS trigger_checklist_template_itens_updated_at ON checklist_template_itens;
CREATE TRIGGER trigger_checklist_template_itens_updated_at
    BEFORE UPDATE ON checklist_template_itens
    FOR EACH ROW
    EXECUTE FUNCTION update_checklist_updated_at();

DROP TRIGGER IF EXISTS trigger_vistoria_checklist_itens_updated_at ON vistoria_checklist_itens;
CREATE TRIGGER trigger_vistoria_checklist_itens_updated_at
    BEFORE UPDATE ON vistoria_checklist_itens
    FOR EACH ROW
    EXECUTE FUNCTION update_checklist_updated_at();

-- ============================================
-- POPULAR DADOS INICIAIS - CHECKLISTS
-- ============================================

-- Checklist para JET SKI
INSERT INTO checklist_templates (tipo_embarcacao, nome, descricao, ativo) VALUES
    ('JET_SKI', 'Checklist Padrão - Jet Ski', 'Sequência de fotos para vistoria de Jet Ski', TRUE)
ON CONFLICT (tipo_embarcacao) DO NOTHING;

INSERT INTO checklist_template_itens (checklist_template_id, ordem, nome, descricao, obrigatorio, permite_video) 
SELECT id, 1, 'Confirmação do nº de inscrição e nome', 'Foto mostrando claramente o número de inscrição e nome do jet ski', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 2, 'Nome do acompanhante', 'Foto ou identificação da pessoa que acompanha a vistoria', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 3, 'Proa (frente)', 'Foto da parte frontal do jet ski', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 4, 'Costado direito', 'Foto do lado direito completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 5, 'Costado esquerdo', 'Foto do lado esquerdo completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 6, 'Modelo do jet', 'Foto mostrando o modelo/marca', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 7, 'Nome do jet', 'Foto do nome/identificação lateral', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 8, 'Popa (traseira)', 'Foto da parte traseira', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 9, 'Propulsão/rabeta', 'Foto do sistema de propulsão', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 10, 'Nº de inscrição e capitania', 'Foto da placa/adesivo com número de inscrição e capitania', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 11, 'Plaqueta do chassi', 'Foto da plaqueta de identificação do chassi', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 12, 'Cockpit (visão geral)', 'Foto do cockpit de cima: parte de trás para frente', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 13, 'Painel de comando', 'Foto do painel de instrumentos', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 14, 'Horas do motor', 'Foto do horímetro mostrando as horas de uso', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 15, 'Acionamento do motor', 'Foto ou vídeo do RPM com jet ski ligado ou propulsor funcionando', TRUE, TRUE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 16, 'Objetos extras', 'Fotos de âncora, coletes salva-vidas, retrovisor, CD player, etc', FALSE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 17, 'Vista geral do motor', 'Foto do motor completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 18, 'Plaqueta do motor', 'Foto da plaqueta de identificação do motor', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
UNION ALL
SELECT id, 19, 'Documentos (TIE)', 'Foto dos documentos, principalmente TIE', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI'
ON CONFLICT DO NOTHING;

-- Checklist para LANCHA
INSERT INTO checklist_templates (tipo_embarcacao, nome, descricao, ativo) VALUES
    ('LANCHA', 'Checklist Padrão - Lancha', 'Sequência de fotos para vistoria de Lancha', TRUE)
ON CONFLICT (tipo_embarcacao) DO NOTHING;

INSERT INTO checklist_template_itens (checklist_template_id, ordem, nome, descricao, obrigatorio, permite_video)
SELECT id, 1, 'Confirmação do nº de inscrição e nome', 'Foto mostrando claramente o número de inscrição e nome da lancha', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 2, 'Nome do acompanhante', 'Foto ou identificação da pessoa que acompanha a vistoria', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 3, 'Proa (frente)', 'Foto da parte frontal da embarcação', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 4, 'Âncora', 'Foto da âncora e sistema de ancoragem', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 5, 'Costado direito', 'Foto do lado direito completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 6, 'Costado esquerdo', 'Foto do lado esquerdo completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 7, 'Nome da lancha', 'Foto do nome/identificação', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 8, 'Popa (traseira)', 'Foto da parte traseira', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 9, 'Nº de inscrição e capitania', 'Foto da placa/adesivo com número de inscrição e capitania', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 10, 'Plaqueta do casco/chassi', 'Foto da plaqueta de identificação do casco', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 11, 'Objetos', 'Fotos de bandeira, defensas, guincho, estofarias, etc', FALSE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 12, 'Painel de comando geral', 'Foto do painel de comando completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 13, 'Equipamentos do painel', 'Foto dos instrumentos e equipamentos', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 14, 'Acionamento do motor', 'Foto ou vídeo do RPM com embarcação ligada ou rabeta funcionando', TRUE, TRUE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 15, 'Horas do motor', 'Foto do horímetro', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 16, 'Extintores + validade', 'Foto dos extintores mostrando validade', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 17, 'Boias salva-vidas', 'Foto das boias salva-vidas', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 18, 'Coletes salva-vidas', 'Foto dos coletes salva-vidas', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 19, 'Visão geral do motor', 'Foto do motor completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 20, 'Bombas de porão', 'Foto das bombas de porão', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 21, 'Bombas de água doce', 'Foto do sistema de água doce', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 22, 'Baterias', 'Foto das baterias', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 23, 'Plaqueta do motor/etiqueta', 'Foto da plaqueta de identificação do motor', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
UNION ALL
SELECT id, 24, 'Documentos (TIE)', 'Foto dos documentos, principalmente TIE', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA'
ON CONFLICT DO NOTHING;

-- Checklist para EMBARCACAO_COMERCIAL
INSERT INTO checklist_templates (tipo_embarcacao, nome, descricao, ativo) VALUES
    ('EMBARCACAO_COMERCIAL', 'Checklist Padrão - Embarcação Comercial', 'Sequência de fotos para vistoria de Embarcação Comercial', TRUE)
ON CONFLICT (tipo_embarcacao) DO NOTHING;

INSERT INTO checklist_template_itens (checklist_template_id, ordem, nome, descricao, obrigatorio, permite_video)
SELECT id, 1, 'Confirmação do nº de inscrição e nome', 'Foto mostrando claramente o número de inscrição e nome da embarcação comercial', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 2, 'Nome do acompanhante', 'Foto ou identificação da pessoa que acompanha a vistoria', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 3, 'Proa (frente)', 'Foto da parte frontal da embarcação', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 4, 'Âncora e sistema de ancoragem', 'Foto da âncora, corrente e sistema completo de ancoragem', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 5, 'Costado direito completo', 'Foto do lado direito completo da embarcação', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 6, 'Costado esquerdo completo', 'Foto do lado esquerdo completo da embarcação', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 7, 'Nome da embarcação', 'Foto do nome/identificação da embarcação', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 8, 'Popa (traseira)', 'Foto da parte traseira completa', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 9, 'Nº de inscrição e capitania', 'Foto da placa/adesivo com número de inscrição e capitania', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 10, 'Plaqueta do casco/chassi', 'Foto da plaqueta de identificação do casco', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 11, 'Estrutura do convés', 'Foto geral do convés principal', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 12, 'Cabine de comando', 'Foto externa da cabine de comando', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 13, 'Painel de comando principal', 'Foto do painel de comando completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 14, 'Equipamentos de navegação', 'Foto dos equipamentos de navegação (GPS, radar, etc)', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 15, 'Rádio comunicador', 'Foto do rádio comunicador e certificado', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 16, 'Acionamento do motor', 'Foto ou vídeo do RPM com embarcação ligada ou motor funcionando', TRUE, TRUE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 17, 'Horas do motor', 'Foto do horímetro mostrando as horas de uso', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 18, 'Extintores + validade', 'Foto dos extintores mostrando validade e localização', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 19, 'Boias salva-vidas', 'Foto das boias salva-vidas e quantidade', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 20, 'Coletes salva-vidas', 'Foto dos coletes salva-vidas e quantidade', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 21, 'Bote salva-vidas', 'Foto do bote salva-vidas e sistema de lançamento', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 22, 'Sinalizadores de emergência', 'Foto dos sinalizadores e equipamentos de sinalização', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 23, 'Visão geral do motor', 'Foto do motor completo', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 24, 'Plaqueta do motor/etiqueta', 'Foto da plaqueta de identificação do motor', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 25, 'Bombas de porão', 'Foto das bombas de porão e sistema de drenagem', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 26, 'Bombas de água doce', 'Foto do sistema de água doce', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 27, 'Baterias', 'Foto das baterias e sistema elétrico', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 28, 'Sistema de combustível', 'Foto do sistema de combustível e tanques', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 29, 'Equipamentos de segurança', 'Foto de equipamentos adicionais (EPIs, cordas, etc)', FALSE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
UNION ALL
SELECT id, 30, 'Documentos (TIE e licenças)', 'Foto dos documentos, principalmente TIE e licenças comerciais', TRUE, FALSE FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL'
ON CONFLICT DO NOTHING;

-- Tabela: Itens de checklist de cada vistoria
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

COMMENT ON TABLE vistoria_checklist_itens IS 'Itens do checklist vinculados a cada vistoria específica';

-- Índices
CREATE INDEX IF NOT EXISTS idx_vistoria_checklist_vistoria ON vistoria_checklist_itens(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_vistoria_checklist_status ON vistoria_checklist_itens(vistoria_id, status);
CREATE INDEX IF NOT EXISTS idx_vistoria_checklist_foto ON vistoria_checklist_itens(foto_id);

-- Trigger
DROP TRIGGER IF EXISTS trigger_vistoria_checklist_updated_at ON vistoria_checklist_itens;
CREATE TRIGGER trigger_vistoria_checklist_updated_at
    BEFORE UPDATE ON vistoria_checklist_itens
    FOR EACH ROW
    EXECUTE FUNCTION update_checklist_updated_at();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    'Sistema de checklist criado com sucesso!' as mensagem,
    (SELECT COUNT(*) FROM checklist_templates) as total_templates,
    (SELECT COUNT(*) FROM checklist_template_itens WHERE checklist_template_id = (SELECT id FROM checklist_templates WHERE tipo_embarcacao = 'JET_SKI')) as itens_jetski,
    (SELECT COUNT(*) FROM checklist_template_itens WHERE checklist_template_id = (SELECT id FROM checklist_templates WHERE tipo_embarcacao = 'LANCHA')) as itens_lancha,
    (SELECT COUNT(*) FROM checklist_template_itens WHERE checklist_template_id = (SELECT id FROM checklist_templates WHERE tipo_embarcacao = 'EMBARCACAO_COMERCIAL')) as itens_comercial;


