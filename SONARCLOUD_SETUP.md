# Configuração do SonarCloud

## Problema: "Project not found"

Se você está recebendo o erro `Project not found`, significa que o projeto ainda não foi criado no SonarCloud ou o token não tem permissões adequadas.

## Solução: Criar o Projeto no SonarCloud

### Opção 1: Criar via Interface Web (Recomendado)

1. **Acesse o SonarCloud:**
   - Vá para: https://sonarcloud.io
   - Faça login com sua conta GitHub

2. **Criar Novo Projeto Backend:**
   - Clique em "Projects" no menu superior
   - Clique em "Create Project" ou "Analyze a new project"
   - Selecione "From GitHub"
   - Escolha a organização: `wuelliton96`
   - Selecione o repositório: `Vessel-Inspection`
   - Configure o projeto com:
     - **Project Key:** `Wuelliton96_Vessel-Inspection`
     - **Name:** `backend`

3. **Criar Novo Projeto Frontend:**
   - Repita o processo acima para criar um segundo projeto
   - Configure o projeto com:
     - **Project Key:** `Wuelliton96_Vessel-Inspection-Frontend`
     - **Name:** `frontend`
   - **Nota:** Você precisa criar os dois projetos separadamente

### Opção 2: Criar Manualmente via API

Se preferir criar via API, você pode usar:

**Para o Backend:**
```bash
curl -X POST "https://sonarcloud.io/api/projects/create" \
  -u "SEU_SONAR_TOKEN:" \
  -d "project=Wuelliton96_Vessel-Inspection" \
  -d "name=backend" \
  -d "organization=wuelliton96"
```

**Para o Frontend:**
```bash
curl -X POST "https://sonarcloud.io/api/projects/create" \
  -u "SEU_SONAR_TOKEN:" \
  -d "project=Wuelliton96_Vessel-Inspection-Frontend" \
  -d "name=frontend" \
  -d "organization=wuelliton96"
```

### Opção 3: Usar Integração Automática do GitHub

1. **Conectar GitHub ao SonarCloud:**
   - Acesse: https://sonarcloud.io/account/organizations
   - Clique em "Add Organization"
   - Selecione "From GitHub"
   - Autorize o SonarCloud a acessar seus repositórios

2. **Configurar Projeto:**
   - Após conectar, o SonarCloud pode criar projetos automaticamente
   - Configure o projeto para usar a chave: `Wuelliton96_Vessel-Inspection`

## Verificar Configuração do Token

1. **Obter Token:**
   - Acesse: https://sonarcloud.io/account/security
   - Gere um novo token (ou use um existente)
   - Copie o token

2. **Configurar no GitHub:**
   - Acesse: https://github.com/Wuelliton96/Vessel-Inspection/settings/secrets/actions
   - Adicione um novo secret chamado `SONAR_TOKEN`
   - Cole o token do SonarCloud

3. **Verificar Permissões:**
   - O token precisa ter permissões de:
     - **Execute Analysis** (obrigatório)
     - **Create Projects** (recomendado, para criar automaticamente)

## Estrutura de Projetos

Este repositório tem **2 projetos** no SonarCloud:

1. **Backend:**
   - Project Key: `Wuelliton96_Vessel-Inspection`
   - Organization: `wuelliton96`
   - Diretório: `backend/`

2. **Frontend:**
   - Project Key: `Wuelliton96_Vessel-Inspection-Frontend`
   - Organization: `wuelliton96`
   - Diretório: `frontend-react/`

## Verificar se o Projeto Existe

Você pode verificar se o projeto existe acessando:
- Backend: https://sonarcloud.io/project/overview?id=Wuelliton96_Vessel-Inspection
- Frontend: https://sonarcloud.io/project/overview?id=Wuelliton96_Vessel-Inspection-Frontend

## Troubleshooting

### Erro: "Project not found"
- ✅ Verifique se o projeto foi criado no SonarCloud
- ✅ Verifique se o `sonar.projectKey` está correto
- ✅ Verifique se a organização está correta
- ✅ Verifique se o `SONAR_TOKEN` tem permissões adequadas

### Erro: "Unauthorized" ou "Forbidden"
- ✅ Verifique se o `SONAR_TOKEN` está configurado corretamente
- ✅ Verifique se o token não expirou
- ✅ Gere um novo token se necessário

### Erro: "Organization not found"
- ✅ Verifique se a organização `wuelliton96` existe no SonarCloud
- ✅ Verifique se você tem acesso à organização

## Links Úteis

- SonarCloud Dashboard: https://sonarcloud.io/dashboard
- Configuração de Tokens: https://sonarcloud.io/account/security
- Documentação: https://docs.sonarcloud.io/

