// tests/setup.js
process.env.NODE_ENV = 'test';
process.env.USE_SQLITE = process.env.USE_SQLITE || '1';

const skipDB = process.env.SKIP_DB === 'true';
let sequelize;
if (!skipDB) {
  ({ sequelize } = require('../models')); // exporte { sequelize, ... } em models/index.js
}

jest.setTimeout(30000);

beforeAll(async () => {
  if (skipDB) return;
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  if (skipDB) return;
  const dialect = sequelize.getDialect?.() || 'sqlite';
  if (dialect === 'sqlite') await sequelize.query('PRAGMA foreign_keys = OFF;');

  const models = Object.values(sequelize.models);
  await Promise.all(
    models.map((m) => m.destroy({ where: {}, truncate: true, force: true, restartIdentity: true }))
  );

  if (dialect === 'sqlite') await sequelize.query('PRAGMA foreign_keys = ON;');
});

afterAll(async () => {
  if (skipDB) return;
  await sequelize.close();
});

// Mock padrão do Clerk (libera)
jest.mock('@clerk/clerk-sdk-node', () => ({
  ClerkExpressRequireAuth: () => (req, _res, next) => {
    req.auth = { userId: 'test-clerk-user-id' };
    next();
  },
}));
