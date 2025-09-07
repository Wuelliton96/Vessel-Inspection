// Configuração global para os testes
const { sequelize } = require('../models');

// Configurar timeout para operações de banco de dados
jest.setTimeout(30000);

// Setup antes de todos os testes
beforeAll(async () => {
  if (process.env.SKIP_DB === 'true') {
    return;
  }
  process.env.NODE_ENV = 'test';
  // Conectar ao banco de dados de teste e sincronizar schema uma vez
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

// Cleanup após todos os testes
afterAll(async () => {
  if (process.env.SKIP_DB === 'true') {
    return;
  }
  // Fechar conexão com o banco de dados
  await sequelize.close();
});

// Limpar dados entre testes
beforeEach(async () => {
  if (process.env.SKIP_DB === 'true') {
    return;
  }
  // Truncar todas as tabelas para acelerar entre testes
  const models = sequelize.models;
  const truncatePromises = Object.values(models).map((model) => model.truncate({ cascade: true, restartIdentity: true }));
  await Promise.all(truncatePromises);
});

// Mock do Clerk para testes
jest.mock('@clerk/clerk-sdk-node', () => ({
  ClerkExpressRequireAuth: () => (req, res, next) => {
    // Mock de usuário autenticado
    req.auth = {
      userId: 'test-clerk-user-id'
    };
    next();
  }
}));
