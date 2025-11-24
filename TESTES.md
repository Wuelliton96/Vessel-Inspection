# Guia de Testes - Backend e Frontend

Este documento explica como executar os testes completos do backend e frontend para garantir que não há erros.

## Testes Disponíveis

### Backend

Para testar o backend completo:

```bash
cd backend
npm run test:completo
```

Ou diretamente:

```bash
cd backend
node scripts/testBackendCompleto.js
```

**O que é testado:**
- ✅ Carregamento de todas as rotas (16 rotas)
- ✅ Carregamento de todos os modelos (18 modelos)
- ✅ Configuração do banco de dados
- ✅ Serviços e utils (uploadService, logger)
- ✅ Middlewares (auth, auditoria)
- ✅ Sintaxe de arquivos principais
- ✅ Verificação de anotações TypeScript em arquivos JS

### Frontend

Para testar o frontend completo (inclui verificação de TypeScript):

```bash
cd frontend-react
npm run test:completo
```

Ou diretamente:

```bash
cd frontend-react
node scripts/testFrontendCompleto.js
```

**O que é testado:**
- ✅ Estrutura de diretórios
- ✅ Arquivos principais
- ✅ Imports válidos
- ✅ Configuração (package.json, tsconfig.json)
- ✅ Dependências (node_modules)
- ✅ **Verificação de tipos TypeScript (tsc --noEmit)**
- ✅ **Erros de sintaxe e tipos**

### Frontend - Build de Produção

Para testar o build completo de produção (mais rigoroso):

```bash
cd frontend-react
npm run build
```

Ou da raiz:

```bash
npm run test:frontend:build
```

**O que é testado:**
- ✅ Compilação completa do TypeScript
- ✅ Todos os erros de tipo
- ✅ Erros de sintaxe
- ✅ Otimização de produção

### Teste Completo (Backend + Frontend)

Para testar ambos de uma vez, use o script na raiz:

**Windows (PowerShell):**
```powershell
cd backend
npm run test:completo
cd ../frontend-react
npm run test:completo
```

**Ou use os scripts npm na raiz:**
```bash
npm run test:backend
npm run test:frontend
npm run test:all
```

**Para teste completo incluindo build de produção:**
```bash
npm run test:all:build
```

Isso testa backend, frontend e executa o build de produção para garantir que não há erros.

## Quando Executar os Testes

Execute os testes sempre que:
- ✅ Fizer alterações no código
- ✅ Antes de fazer commit
- ✅ Antes de fazer deploy
- ✅ Quando encontrar erros inesperados
- ✅ Após instalar novas dependências

## Resultado dos Testes

### Backend
- **OK**: Todas as rotas, modelos e serviços carregados sem erros
- **ERRO**: Algum problema encontrado (será listado)

### Frontend
- **OK**: Estrutura correta e arquivos principais encontrados
- **ERRO**: Algum problema encontrado (será listado)

## Resolução de Problemas

### Erro: "Cannot find module"
- Execute `npm install` no diretório correspondente

### Erro: "SyntaxError: Unexpected token"
- Verifique se há anotações TypeScript (`: any`, `: string`, etc.) em arquivos `.js`
- Arquivos JavaScript não devem ter anotações de tipo

### Erro: "Route not found"
- Verifique se todas as rotas estão sendo importadas no `server.js`

## Scripts Adicionais

### Backend
- `npm test` - Executa testes unitários (Jest)
- `npm run test:coverage` - Testes com cobertura
- `npm run test:completo` - Teste completo de validação

### Frontend
- `npm test` - Executa testes do React
- `npm run build` - Verifica erros de TypeScript na compilação
- `npm run test:completo` - Teste completo de validação

