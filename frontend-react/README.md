# SGVN Frontend - Sistema de Gerenciamento de Vistorias Nauticas

Frontend do sistema SGVN desenvolvido em React com TypeScript.

---

## Tecnologias Utilizadas

- React 19
- TypeScript 4.9
- React Router DOM 7
- Styled Components 6
- Axios
- React Query (TanStack)
- Lucide React (icones)

---

## Pre-requisitos

- Node.js 18.x ou superior
- npm ou yarn
- Backend do SGVN rodando na porta 3000

---

## Instalacao

```bash
# Acessar o diretorio do frontend
cd frontend-react

# Instalar dependencias
npm install

# Criar arquivo de configuracao (opcional)
echo "REACT_APP_API_URL=http://localhost:3000" > .env
```

---

## Scripts Disponiveis

### Desenvolvimento

```bash
npm start
```
Executa a aplicacao em modo de desenvolvimento.
Acesse http://localhost:3001 no navegador.

### Build de Producao

```bash
npm run build
```
Gera a versao otimizada para producao na pasta `build`.

### Testes

```bash
# Executar testes em modo watch
npm test

# Executar testes com cobertura
npm run test:coverage

# Executar testes para CI/CD
npm run test:ci

# Executar suite completa de testes
npm run test:completo
```

---

## Estrutura de Pastas

```
frontend-react/
├── src/
│   ├── components/     # Componentes reutilizaveis
│   ├── config/         # Configuracoes da aplicacao
│   ├── contexts/       # Context API (AuthContext)
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Paginas da aplicacao
│   ├── services/       # Servicos de API
│   ├── styles/         # Estilos globais
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Funcoes utilitarias
│   ├── __mocks__/      # Mocks para testes
│   ├── App.tsx         # Componente principal
│   └── index.tsx       # Ponto de entrada
├── public/             # Arquivos estaticos
├── package.json        # Dependencias e scripts
└── tsconfig.json       # Configuracao TypeScript
```

---

## Principais Componentes

### Paginas

| Pagina | Descricao |
|--------|-----------|
| Login | Autenticacao de usuarios |
| Dashboard | Painel com estatisticas |
| Vistorias | Listagem e gestao de vistorias |
| Laudos | Geracao e visualizacao de laudos |
| Embarcacoes | Cadastro de embarcacoes |
| Usuarios | Gestao de usuarios (admin) |
| Vistoriadores | Gestao de vistoriadores |

### Contextos

- **AuthContext**: Gerencia autenticacao, sessao do usuario e controle de acesso

### Hooks Customizados

- **useInactivityTimeout**: Logout automatico por inatividade
- **useAccessControl**: Controle de permissoes por nivel de acesso

---

## Configuracao de Ambiente

### Variaveis de Ambiente

Crie um arquivo `.env` na raiz do frontend:

```env
REACT_APP_API_URL=http://localhost:3000
```

Para producao:

```env
REACT_APP_API_URL=https://sua-api.elasticbeanstalk.com
```

---

## Testes

### Executar Testes

```bash
# Modo interativo
npm test

# Com relatorio de cobertura
npm run test:coverage
```

### Estrutura de Testes

Os testes estao organizados em pastas `__tests__` dentro de cada modulo:

```
src/
├── components/__tests__/
├── contexts/__tests__/
├── hooks/__tests__/
├── pages/__tests__/
├── services/__tests__/
├── types/__tests__/
└── utils/__tests__/
```

### Cobertura Atual

- Meta: 25% de cobertura
- Testes criados: 40+
- Ferramentas: Jest + React Testing Library

---

## Niveis de Acesso

### Administrador
- Acesso total ao sistema
- Gestao de usuarios
- Aprovacao de vistorias
- Geracao de laudos

### Vistoriador
- Visualizacao de vistorias atribuidas
- Realizacao de vistorias
- Upload de fotos
- Preenchimento de checklists

---

## Deploy

### Vercel

1. Acesse https://vercel.com
2. Importe o repositorio GitHub
3. Configure:
   - Root Directory: `frontend-react`
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Environment Variable: `REACT_APP_API_URL`

---

## Proxy de Desenvolvimento

O frontend esta configurado para proxy das requisicoes para `http://localhost:3000` durante o desenvolvimento. Isso esta definido no `package.json`:

```json
{
  "proxy": "http://localhost:3000"
}
```

---

## Solucao de Problemas

### Erro de CORS
Verifique se o backend esta rodando e se o proxy esta configurado corretamente.

### Erro de Conexao com API
Confirme que a variavel `REACT_APP_API_URL` esta definida corretamente.

### Testes Falhando
Execute `npm install` para garantir que todas as dependencias estao instaladas.

---

## Autor

Projeto TCC - Sistema de Gerenciamento de Vistorias Nauticas
