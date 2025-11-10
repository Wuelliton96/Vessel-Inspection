-- ============================================
-- MIGRATION: Sistema de Clientes
-- Descrição: Cria tabela de clientes (PF/PJ) com endereço completo e migra dados
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

-- Migrar proprietários de embarcações para clientes (se houver)
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
-- VERIFICAÇÃO
-- ============================================
SELECT 
    'Sistema de clientes criado com sucesso!' as mensagem,
    (SELECT COUNT(*) FROM clientes) as total_clientes,
    (SELECT COUNT(*) FROM embarcacoes WHERE cliente_id IS NOT NULL) as embarcacoes_vinculadas;

