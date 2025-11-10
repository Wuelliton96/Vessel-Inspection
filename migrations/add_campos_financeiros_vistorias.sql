-- migrations/add_campos_financeiros_vistorias.sql
-- Script para adicionar campos financeiros na tabela de vistorias
-- Data: 05/11/2025

-- Adicionar os 3 campos financeiros na tabela vistorias
ALTER TABLE vistorias
  ADD COLUMN IF NOT EXISTS valor_embarcacao   DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS valor_vistoria     DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS valor_vistoriador  DECIMAL(10, 2);

-- Adicionar comentários para documentação
COMMENT ON COLUMN vistorias.valor_embarcacao IS 'Valor estimado da embarcação em R$ (Reais)';
COMMENT ON COLUMN vistorias.valor_vistoria IS 'Valor total da vistoria em R$ (Reais)';
COMMENT ON COLUMN vistorias.valor_vistoriador IS 'Valor a ser pago ao vistoriador em R$ (Reais)';

-- Verificar se as colunas foram adicionadas
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'vistorias' 
  AND column_name IN ('valor_embarcacao', 'valor_vistoria', 'valor_vistoriador')
ORDER BY column_name;

-- Exemplo de uso:
-- UPDATE vistorias SET 
--   valor_embarcacao = 150000.00,
--   valor_vistoria = 500.00,
--   valor_vistoriador = 300.00
-- WHERE id = 1;

