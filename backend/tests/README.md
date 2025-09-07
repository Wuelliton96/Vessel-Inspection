# Testes do Backend - SGVN

Este diretório contém todos os testes automatizados para o backend do Sistema de Gerenciamento de Vistorias Náuticas (SGVN).

## 📁 Estrutura dos Testes

```
tests/
├── models/              # Testes unitários dos modelos Sequelize
│   ├── Usuario.test.js
│   ├── NivelAcesso.test.js
│   ├── Embarcacao.test.js
│   ├── Vistoria.test.js
│   ├── Local.test.js
│   ├── StatusVistoria.test.js
│   ├── Foto.test.js
│   ├── Laudo.test.js
│   └── TipoFotoChecklist.test.js
├── middleware/          # Testes dos middlewares
│   └── auth.test.js
├── routes/              # Testes de integração das rotas
│   ├── userRoutes.test.js
│   └── vistoriaRoutes.test.js
├── helpers/             # Helpers e utilitários para testes
│   └── testHelpers.js
├── config/              # Configurações específicas para testes
│   └── test.env
├── setup.js             # Configuração global dos testes
└── README.md            # Este arquivo
```

## 🚀 Como Executar os Testes

### Pré-requisitos

1. **Banco de dados PostgreSQL** rodando localmente
2. **Banco de dados de teste** criado:
   ```sql
   CREATE DATABASE sgvn_test;
   ```
3. **Variáveis de ambiente** configuradas (veja `tests/config/test.env`)

### Comandos Disponíveis

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (desenvolvimento)
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage

# Executar testes para CI/CD
npm run test:ci

# Executar script personalizado
node scripts/test.js

# Executar testes específicos
npx jest tests/models/Usuario.test.js

# Executar testes com padrão específico
npx jest --testNamePattern="deve criar"
```

## 🧪 Tipos de Testes

### 1. Testes Unitários (Models)
- **Objetivo**: Testar cada modelo Sequelize individualmente
- **Cobertura**: Criação, validações, associações, operações CRUD
- **Localização**: `tests/models/`

### 2. Testes de Middleware
- **Objetivo**: Testar middlewares de autenticação e autorização
- **Cobertura**: Autenticação, autorização, tratamento de erros
- **Localização**: `tests/middleware/`

### 3. Testes de Integração (Routes)
- **Objetivo**: Testar endpoints da API de forma integrada
- **Cobertura**: Requisições HTTP, validações, respostas
- **Localização**: `tests/routes/`

### 4. Testes do Servidor
- **Objetivo**: Testar configuração e funcionamento básico do servidor
- **Cobertura**: Rotas principais, middleware, tratamento de erros
- **Localização**: `tests/server.test.js`

## 🔧 Configuração

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!jest.config.js',
    '!server.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000
};
```

### Setup Global (`tests/setup.js`)
- Configuração do banco de dados de teste
- Limpeza entre testes
- Mocks globais (Clerk, etc.)

### Helpers (`tests/helpers/testHelpers.js`)
- Funções utilitárias para criar dados de teste
- Limpeza de dados
- Mocks reutilizáveis

## 📊 Cobertura de Testes

O projeto mantém uma cobertura de testes abrangente:

- **Models**: 100% dos modelos testados
- **Routes**: Todas as rotas principais testadas
- **Middleware**: Autenticação e autorização testadas
- **Server**: Configuração básica testada

### Relatório de Cobertura
Após executar `npm run test:coverage`, o relatório estará disponível em:
- **HTML**: `backend/coverage/index.html`
- **Terminal**: Saída no console
- **LCOV**: `backend/coverage/lcov.info`

## 🐛 Debugging

### Executar Testes em Modo Debug
```bash
# Com logs detalhados
DEBUG=* npm test

# Com logs específicos do Jest
DEBUG=jest* npm test

# Com logs do Sequelize
DEBUG=sequelize* npm test
```

### Testes Individuais
```bash
# Executar apenas um arquivo de teste
npx jest tests/models/Usuario.test.js --verbose

# Executar apenas um teste específico
npx jest --testNamePattern="deve criar usuário" --verbose
```

## 🔄 CI/CD

### GitHub Actions
Os testes são executados automaticamente em:
- Push para branches principais
- Pull requests
- Tags de release

### Configuração para CI
```yaml
- name: Run Tests
  run: |
    npm run test:ci
    npm run test:coverage
```

## 📝 Convenções

### Nomenclatura
- **Arquivos de teste**: `*.test.js`
- **Describe blocks**: Nome do componente testado
- **Test cases**: Descrição do comportamento esperado

### Estrutura dos Testes
```javascript
describe('Componente', () => {
  describe('Funcionalidade', () => {
    it('deve fazer algo específico', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Dados de Teste
- Usar `testHelpers.js` para dados consistentes
- Limpar dados entre testes
- Usar mocks para dependências externas

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verificar se PostgreSQL está rodando
   - Verificar se o banco `sgvn_test` existe
   - Verificar variáveis de ambiente

2. **Testes falhando por dados duplicados**
   - Verificar se `beforeEach` está limpando dados
   - Verificar se `afterAll` está fechando conexões

3. **Timeouts**
   - Aumentar `testTimeout` no `jest.config.js`
   - Verificar se operações assíncronas estão sendo aguardadas

4. **Mocks não funcionando**
   - Verificar se mocks estão no local correto
   - Verificar se `jest.mock()` está sendo chamado antes dos imports

### Logs Úteis
```bash
# Ver logs detalhados do Jest
npx jest --verbose --no-cache

# Ver logs do banco de dados
DEBUG=sequelize* npm test

# Ver logs de requisições HTTP
DEBUG=supertest* npm test
```

## 📚 Recursos Adicionais

- [Documentação do Jest](https://jestjs.io/docs/getting-started)
- [Documentação do Supertest](https://github.com/visionmedia/supertest)
- [Documentação do Sequelize Testing](https://sequelize.org/docs/v6/other-topics/testing/)
- [Best Practices para Testes Node.js](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🤝 Contribuindo

Ao adicionar novos testes:

1. Siga as convenções estabelecidas
2. Mantenha cobertura alta
3. Use helpers quando possível
4. Documente casos especiais
5. Execute todos os testes antes de fazer commit

---

**Última atualização**: $(date)
**Versão**: 1.0.0
