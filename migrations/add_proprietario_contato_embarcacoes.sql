-- ============================================
-- MIGRAÇÃO: Adicionar CPF e Telefone do Proprietário em Embarcações
-- Data: 2025-01-06
-- Descrição: Adiciona campos de contato do proprietário
-- ============================================

-- Adicionar colunas de contato do proprietário
ALTER TABLE embarcacoes
  ADD COLUMN IF NOT EXISTS proprietario_cpf            CHAR(11),
  ADD COLUMN IF NOT EXISTS proprietario_telefone_e164  VARCHAR(20);

-- Adicionar comentários para documentação
COMMENT ON COLUMN embarcacoes.proprietario_cpf IS 'CPF do proprietário (apenas dígitos)';
COMMENT ON COLUMN embarcacoes.proprietario_telefone_e164 IS 'Telefone do proprietário no formato E.164 (+5511999998888)';

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute para verificar se as colunas foram adicionadas:
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'embarcacoes' 
--   AND column_name IN ('proprietario_cpf', 'proprietario_telefone_e164');

