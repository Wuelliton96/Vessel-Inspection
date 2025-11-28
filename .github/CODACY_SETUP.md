# Configuração do Codacy Coverage

Este documento explica como configurar o Codacy Coverage no projeto.

## Pré-requisitos

1. Ter uma conta no Codacy
2. Ter o projeto `Vessel-Inspection` configurado no Codacy
3. Ter um API Token do Codacy

## Passo 1: Obter o API Token do Codacy

1. Acesse o Codacy: https://app.codacy.com
2. Vá em **Settings** > **Integrations** > **API Tokens**
3. Crie um novo token ou copie um existente
4. O token deve ter o formato: `xxxxxxxxxxxxxxxxxWfg`

## Passo 2: Configurar o Secret no GitHub

1. Acesse o repositório no GitHub: https://github.com/Wuelliton96/Vessel-Inspection
2. Vá em **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. Configure:
   - **Name**: `CODACY_API_TOKEN`
   - **Secret**: Cole o token do Codacy que você copiou
5. Clique em **Add secret**

## Passo 3: Verificar a Configuração

Os workflows já estão configurados para enviar os relatórios de cobertura para o Codacy:

- **build.yml**: Envia cobertura do backend e frontend
- **ci-cd.yml**: Envia cobertura do backend e frontend

## Como Funciona

1. Os testes são executados e geram relatórios LCOV em:
   - `backend/coverage/lcov.info`
   - `frontend-react/coverage/lcov.info`

2. O Codacy Coverage Reporter é executado automaticamente após os testes

3. Os relatórios são enviados para o Codacy usando:
   - API Token: `CODACY_API_TOKEN` (secret do GitHub)
   - Organization Provider: `gh` (GitHub)
   - Username: `Wuelliton96`
   - Project Name: `Vessel-Inspection`

## Verificar se Está Funcionando

Após configurar o secret e executar o workflow:

1. Acesse o Codacy: https://app.codacy.com
2. Vá para o projeto `Vessel-Inspection`
3. Vá em **Coverage** para ver os relatórios de cobertura

## Troubleshooting

### Erro: "CODACY_API_TOKEN not found"
- Verifique se o secret foi criado corretamente no GitHub
- Certifique-se de que o nome do secret é exatamente `CODACY_API_TOKEN`

### Erro: "Coverage file not found"
- Verifique se os testes foram executados com sucesso
- Verifique se os arquivos `lcov.info` foram gerados nos diretórios de coverage

### Cobertura não aparece no Codacy
- Verifique se o projeto está configurado no Codacy
- Verifique se o token tem permissões para o projeto
- Verifique os logs do workflow no GitHub Actions

