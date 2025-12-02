# SGVN - Sistema de Gerenciamento de Vistorias Náuticas

[![CI/CD](https://github.com/Wuelliton96/Vessel-Inspection/actions/workflows/ci.yml/badge.svg)](https://github.com/Wuelliton96/Vessel-Inspection/actions)
[![Coverage](https://codecov.io/gh/Wuelliton96/Vessel-Inspection/branch/main/graph/badge.svg)](https://codecov.io/gh/Wuelliton96/Vessel-Inspection)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Wuelliton96_Vessel-Inspection&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Wuelliton96_Vessel-Inspection)

Sistema completo para gerenciamento de vistorias náuticas com geração automática de laudos profissionais em PDF.

---

## Sobre o Projeto

Sistema desenvolvido como Trabalho de Conclusão de Curso (TCC) para gerenciar vistorias náuticas, incluindo:

- Cadastro de embarcações e locais
- Gerenciamento de vistorias
- Upload de fotos com checklist
- **Geração automática de laudos em PDF**
- Sistema de pagamentos para vistoriadores
- Dashboard administrativo
- Controle de acesso (Admin/Vistoriador)
- **Integração com API ViaCEP** (consulta de endereços)
- **Segurança robusta** (Rate Limiting, XSS Protection, Helmet)
- **Testes automatizados** (75% backend, 25% frontend)
- **CI/CD completo** (GitHub Actions)
- **Monitoramento em produção** (New Relic APM)

---

## Arquitetura

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   React     │ ───► │   Express    │ ───► │  PostgreSQL  │
│  Frontend   │      │   Backend    │      │   Database   │
└─────────────┘      └──────────────┘      └──────────────┘
      │                     │                      │
      │                     │                      │
   Render          AWS Elastic Beanstalk      AWS RDS
```

### Stack Tecnológica:

**Backend:**
- Node.js + Express.js
- PostgreSQL + Sequelize ORM
- JWT Authentication + Rate Limiting
- Helmet.js (Security Headers)
- Express Validator (XSS Protection)
- PDFKit (geração de PDFs)
- ViaCEP Integration (API Externa)
- New Relic (APM)
- Winston + Morgan (logging)

**Frontend:**
- React 18 + TypeScript
- Styled Components
- React Router
- Axios
- Lucide Icons

**DevOps:**
- GitHub Actions (CI/CD)
- AWS Elastic Beanstalk (backend hosting)
- Render (frontend hosting)
- SonarCloud (code quality)
- Codecov (coverage)
- New Relic (monitoring)

---

## Pré-requisitos

- **Node.js** 18.x ou superior
- **PostgreSQL** 15.x ou superior
- **Git**
- **npm** ou **yarn**

---

## Instalação Local

### 1. Clone o repositório
```bash
git clone https://github.com/Wuelliton96/Vessel-Inspection.git
cd Vessel-Inspection
```

### 2. Configure o Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# Editar .env com suas configurações
```

**Variáveis de ambiente (`.env`):**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sgvn
DB_SSL=false

# JWT
JWT_SECRET=sua-chave-secreta-super-segura

# New Relic (opcional para desenvolvimento)
NEW_RELIC_LICENSE_KEY=your-license-key
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

```bash
# Executar migrations
psql -U postgres -d sgvn -f migrations/EXECUTAR_TODAS_MIGRATIONS.sql

# Popular banco com dados de teste
npm run seed

# Popular status de vistorias
node scripts/populateStatusVistoria.js
```

### 3. Configure o Frontend

```bash
cd frontend-react

# Instalar dependências
npm install

# Criar arquivo .env
echo "REACT_APP_API_URL=http://localhost:3000" > .env
```

---

## Executando o Projeto

### Modo Desenvolvimento:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Servidor rodando em `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend-react
npm start
```
Aplicação rodando em `http://localhost:3001`

### Usuários de Teste:

**Administrador:**
```
Cpf: 650.347.920-44
Senha: Admin@123
```

**Vistoriador:**
```
Cpf: 142.290.560-87
Senha: Vstoriador@123
```

---

## Testes

### Backend (Meta: 75% cobertura)
```bash
cd backend

# Rodar todos os testes
npm test

# Com cobertura
npm test -- --coverage

# Testes específicos
npm test -- tests/models/Laudo.test.js
```

### Frontend (Meta: 25% cobertura)
```bash
cd frontend-react

# Rodar todos os testes
npm test

# Com cobertura
npm test -- --coverage --watchAll=false
```

### Cobertura Atual:
- Backend: **107 testes** criados
- Frontend: **36 testes** criados
- Model Laudo: **100%** cobertura
- Utils Validators: **100%** cobertura

---

## Deploy em Produção

### 1. Backend - AWS Elastic Beanstalk

```bash
# Instalar AWS CLI e EB CLI
pip install awsebcli

# Configurar AWS
aws configure

# Deploy
cd backend
eb init
eb create sgvn-backend-prod

# Configurar variáveis de ambiente:
eb setenv \
  DATABASE_URL="postgresql://..." \
  JWT_SECRET="..." \
  NEW_RELIC_LICENSE_KEY="..." \
  NODE_ENV="production"

# Deploy
eb deploy
```

### 2. Frontend - Render

```bash
# 1. Acessar https://render.com
# 2. New Static Site
# 3. Conectar GitHub
# 4. Configurar:
#    - Root Directory: frontend-react
#    - Build Command: npm install && npm run build
#    - Publish Directory: build
#    - Environment Variable:
#      REACT_APP_API_URL=https://seu-app.elasticbeanstalk.com
```

### 3. Configurar Secrets GitHub

No repositório GitHub, vá em **Settings → Secrets → Actions** e adicione:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
RENDER_DEPLOY_HOOK
SONAR_TOKEN
NEW_RELIC_API_KEY
NEW_RELIC_ACCOUNT_ID
NEW_RELIC_APPLICATION_ID
```

Após configurar, todo push na branch `main` fará deploy automático!

---

## Monitoramento - New Relic

### Ativar New Relic:

1. Criar conta em https://newrelic.com (grátis para estudantes)
2. Criar aplicação APM
3. Copiar License Key
4. Adicionar ao `.env`:
```env
NEW_RELIC_LICENSE_KEY=seu-license-key
NODE_ENV=production
```

### O que é monitorado:
- Performance de todas as rotas
- Tempo de resposta de cada endpoint
- Erros e exceções em tempo real
- Performance do banco de dados
- Memória e CPU
- Throughput (requisições/segundo)
- Distributed tracing

### Acessar dashboards:
```
https://one.newrelic.com
```

---

## Análise de Código - SonarCloud

### Configuração:

1. Acessar https://sonarcloud.io
2. Conectar com GitHub
3. Importar repositório
4. Adicionar `SONAR_TOKEN` nos secrets do GitHub

### Análise automática:
- Cada push roda análise de código
- Detecta bugs, vulnerabilidades e code smells
- Gera relatórios de qualidade
- Rastreia dívida técnica

---

## Estrutura do Projeto

```
Vessel-Inspection/
├── backend/
│   ├── config/          # Configuração do banco
│   ├── middleware/      # Auth middleware
│   ├── models/          # Models Sequelize
│   ├── routes/          # Rotas da API
│   ├── services/        # Serviços (PDF, upload)
│   ├── tests/           # Testes automatizados
│   ├── utils/           # Utilitários e validators
│   ├── uploads/         # Arquivos uploadados
│   │   ├── fotos/       # Fotos das vistorias
│   │   └── laudos/      # PDFs dos laudos
│   ├── newrelic.js      # Config New Relic
│   └── server.js        # Servidor principal
│
├── frontend-react/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── contexts/    # Context API
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utilitários
│   └── package.json
│
├── migrations/          # Migrations SQL
├── .github/workflows/   # GitHub Actions
│   ├── ci.yml          # Testes e qualidade
│   └── deploy.yml      # Deploy automático
│
└── README.md
```

---

## Funcionalidades Principais

### 1. **Sistema de Vistorias**
- Criar e gerenciar vistorias
- Atribuir a vistoriadores
- Upload de fotos com checklist
- Acompanhamento de status

### 2. **Geração de Laudos (NOVO!)**
- Formulário completo com 100+ campos
- 11 seções organizadas em abas
- Checklists (Elétrica, Hidráulica, Geral)
- Geração de PDF profissional
- Sistema de rascunho (salvar e continuar)
- Download automático
- Fotos incluídas no PDF

### 3. **Gestão de Pagamentos**
- Lotes de pagamento para vistoriadores
- Controle de valores
- Histórico de pagamentos

### 4. **Dashboard Administrativo**
- Estatísticas em tempo real
- Gráficos de desempenho
- Ranking de vistoriadores

---

## Níveis de Acesso

### ADMINISTRADOR
- Gerenciar usuários
- Criar vistorias
- **Criar e gerenciar laudos**
- Aprovar vistorias
- Processar pagamentos
- Acesso total ao sistema

### VISTORIADOR
- Ver vistorias atribuídas
- Realizar vistorias
- Upload de fotos
- Preencher checklists

---

## Monitoramento e Qualidade

### Métricas de Cobertura de Testes:
```bash
Backend:  107 testes (Meta: 75%)
Frontend:  36 testes (Meta: 25%)
```

### Health Check:
```bash
curl http://localhost:3000/health

Response:
{
  "status": "healthy",
  "uptime": 3600,
  "database": "connected",
  "environment": "production"
}
```

### Logs:
```bash
backend/logs/
  ├── error.log      # Apenas erros
  └── combined.log   # Todos os logs
```

---

## Convenções de Commit

Este projeto segue o padrão **Conventional Commits** para facilitar a leitura do histórico e a geração automática de changelogs. Abaixo está a explicação de cada tipo de commit:

### Tipos de Commit:

**feat:** Nova funcionalidade
- Adiciona uma nova feature ao sistema
- Exemplo: `feat: adicionar geração de PDF para laudos`
- Quando usar: Ao implementar algo novo que o usuário vai usar

**fix:** Correção de bug
- Corrige um problema existente no código
- Exemplo: `fix: corrigir erro ao salvar vistoria sem local`
- Quando usar: Ao corrigir algo que estava quebrado

**chore:** Tarefas de manutenção
- Mudanças que não afetam o código de produção diretamente
- Exemplo: `chore: atualizar dependências do package.json`
- Quando usar: Para atualizar dependências, configurar ferramentas, ajustar scripts de build, etc.

**docs:** Documentação
- Mudanças apenas na documentação
- Exemplo: `docs: atualizar README com instruções de instalação`
- Quando usar: Ao atualizar README, comentários no código, ou qualquer documentação

**style:** Formatação de código
- Mudanças que não alteram a lógica (espaços, ponto e vírgula, etc.)
- Exemplo: `style: corrigir indentação no arquivo LaudoForm.tsx`
- Quando usar: Ao ajustar formatação, espaçamento, ou estilo do código sem mudar funcionalidade

**refactor:** Refatoração
- Reorganização do código sem mudar funcionalidade
- Exemplo: `refactor: reorganizar estrutura de pastas do backend`
- Quando usar: Ao melhorar a estrutura do código sem adicionar features ou corrigir bugs

**test:** Testes
- Adição ou correção de testes
- Exemplo: `test: adicionar testes para geração de laudo PDF`
- Quando usar: Ao criar ou modificar testes automatizados

**perf:** Melhorias de performance
- Otimizações que melhoram a velocidade ou uso de recursos
- Exemplo: `perf: otimizar consulta de vistorias no banco de dados`
- Quando usar: Ao melhorar a performance do sistema

**ci:** Configuração de CI/CD
- Mudanças em arquivos de integração contínua
- Exemplo: `ci: adicionar step de análise SonarCloud no GitHub Actions`
- Quando usar: Ao modificar workflows, scripts de deploy, ou configurações de CI/CD

**build:** Sistema de build
- Mudanças que afetam o processo de build ou dependências
- Exemplo: `build: atualizar webpack para versão 5`
- Quando usar: Ao modificar ferramentas de build, compiladores, ou dependências de desenvolvimento

**revert:** Reverter commit anterior
- Desfaz mudanças de um commit anterior
- Exemplo: `revert: reverter commit abc123 que causou erro`
- Quando usar: Ao desfazer um commit que causou problemas

### Formato do Commit:

```
<tipo>(<escopo>): <descrição curta>

<corpo opcional com mais detalhes>

<rodapé opcional com referências>
```

**Exemplos práticos:**

```
feat(laudos): adicionar geração de PDF com fotos

Implementa a funcionalidade de gerar PDFs dos laudos incluindo
as fotos anexadas na vistoria. O PDF é gerado usando pdf-lib
e salvo no diretório uploads/laudos.

Closes #123
```

```
fix(vistorias): corrigir erro ao editar vistoria sem local

O sistema estava quebrando quando tentava editar uma vistoria
que não tinha local associado. Agora valida se o local existe
antes de tentar acessar suas propriedades.

Fixes #456
```

```
chore: atualizar dependências do backend

Atualiza todas as dependências do package.json para suas
versões mais recentes, incluindo express, sequelize e jwt.

BREAKING CHANGE: Sequelize agora requer Node.js 18+
```

### Por que usar essas convenções?

1. **Histórico claro:** Facilita entender o que cada commit fez
2. **Changelog automático:** Ferramentas podem gerar changelogs automaticamente
3. **Filtragem:** Permite filtrar commits por tipo (ex: ver só correções de bugs)
4. **Padrão da indústria:** É o padrão usado por grandes projetos open source
5. **Melhor colaboração:** Outros desenvolvedores entendem rapidamente o que mudou

---

## Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças seguindo as [Convenções de Commit](#convenções-de-commit) (`git commit -m 'feat: Nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

**CI/CD irá:**
- Rodar todos os testes
- Verificar cobertura (75%/25%)
- Análise SonarCloud
- Deploy automático se aprovado

---

## Licença

Este projeto é um Trabalho de Conclusão de Curso (TCC).

---

## Autor

**Wuelliton**  
Projeto TCC - Sistema de Gerenciamento de Vistorias Náuticas

---

## Suporte e Documentação

### Documentação Completa (NOVA!)

**Criamos uma documentação abrangente do projeto:**

- **[ÍNDICE](./INDICE_DOCUMENTACAO.md)** - Comece aqui para navegar pela documentação
- **[COMO USAR](./COMO_USAR_DOCUMENTACAO.md)** - Guia de como usar os documentos
- **[RESUMO EXECUTIVO](./RESUMO_EXECUTIVO.md)** - Visão resumida do projeto (5 páginas)
- **[WIKI COMPLETO](./WIKI.md)** - Documentação técnica completa (100+ páginas)
- **[REVIEW RFC vs IMPLEMENTAÇÃO](./REVIEW_RFC_VS_IMPLEMENTACAO.md)** - Análise comparativa (60 páginas)
- **[ROADMAP](./ROADMAP.md)** - Próximos passos e pendências (30 páginas)

### Documentação Anterior

Para dúvidas ou problemas:
- Abra uma [Issue](https://github.com/Wuelliton96/Vessel-Inspection/issues)
- Consulte a [Documentação Completa](./GUIA_COMPLETO_TCC.md)
- Veja o [Guia de Deploy AWS + Render](./DEPLOY_AWS_RENDER.md)
- Veja o [Relatório de Testes](./RELATORIO_FINAL_SISTEMA_LAUDOS.md)

---

## Critérios TCC - STATUS

| Critério | Status |
|----------|--------|
| Projeto em produção | Configurado (AWS + Render) |
| Deploy automático | GitHub Actions |
| Cobertura 75%/25% | 129 testes backend, 40 frontend |
| Análise de código | SonarCloud |
| Monitoramento | New Relic APM |

**Sistema pronto para apresentação!**
