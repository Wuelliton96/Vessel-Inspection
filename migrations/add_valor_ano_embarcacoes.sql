-- ============================================
-- MIGRATION: Adicionar Valor e Ano na Embarcação
-- Descrição: Move valor_embarcacao de vistorias para embarcacoes e adiciona ano_fabricacao
-- ============================================

-- Adicionar campos na tabela embarcacoes
ALTER TABLE embarcacoes
  ADD COLUMN IF NOT EXISTS valor_embarcacao DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS ano_fabricacao INTEGER;

COMMENT ON COLUMN embarcacoes.valor_embarcacao IS 'Valor estimado da embarcação em R$';
COMMENT ON COLUMN embarcacoes.ano_fabricacao IS 'Ano de fabricação da embarcação';

-- Adicionar constraint para ano (deve ser razoável)
ALTER TABLE embarcacoes
  ADD CONSTRAINT IF NOT EXISTS check_ano_fabricacao 
  CHECK (ano_fabricacao IS NULL OR (ano_fabricacao >= 1900 AND ano_fabricacao <= 2100));

-- ============================================
-- MIGRAR DADOS (opcional - se quiser manter dados existentes)
-- ============================================
-- Se houver vistorias com valor_embarcacao, copiar para a embarcação
-- UPDATE embarcacoes e
-- SET valor_embarcacao = (
--     SELECT v.valor_embarcacao 
--     FROM vistorias v 
--     WHERE v.embarcacao_id = e.id 
--     AND v.valor_embarcacao IS NOT NULL
--     ORDER BY v.created_at DESC 
--     LIMIT 1
-- )
-- WHERE valor_embarcacao IS NULL;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    'Campos adicionados com sucesso!' as mensagem,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'embarcacoes' AND column_name = 'valor_embarcacao') as valor_embarcacao,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'embarcacoes' AND column_name = 'ano_fabricacao') as ano_fabricacao;


