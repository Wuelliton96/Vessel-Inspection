-- ============================================
-- MIGRATION: Adicionar dados da Corretora nas Vistorias
-- Descrição: Adiciona campos de corretora para envio de laudo
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
-- VERIFICAÇÃO
-- ============================================
SELECT 
    'Campos de corretora adicionados com sucesso!' as mensagem,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'vistorias' AND column_name = 'corretora_nome') as corretora_nome,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'vistorias' AND column_name = 'corretora_telefone_e164') as corretora_telefone,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'vistorias' AND column_name = 'corretora_email_laudo') as corretora_email;


