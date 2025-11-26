const request = require('supertest');
const { sequelize, Vistoria, Embarcacao, Local, StatusVistoria } = require('../../models');
const dashboardRoutes = require('../../routes/dashboardRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/dashboard', router: dashboardRoutes });

describe('Rotas de Dashboard', () => {
  let adminToken;
  let admin;

  beforeAll(async () => {
    // IMPORTANTE: force: true apaga e recria todas as tabelas
    // Isso é SEGURO porque NODE_ENV=test garante uso de banco de teste (TEST_DATABASE_URL)
    // NUNCA apagará dados de produção quando configurado corretamente
    const setup = await setupCompleteTestEnvironment('dashboard');
    admin = setup.admin;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/dashboard/estatisticas', () => {
    it('deve retornar estatísticas do dashboard (admin)', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('vistoriasPorStatus');
      expect(response.body).toHaveProperty('vistoriasMesAtual');
      expect(response.body).toHaveProperty('vistoriasMesAnterior');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/dashboard/estatisticas');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/vistorias-recentes', () => {
    it('deve retornar vistorias recentes (admin)', async () => {
      const response = await request(app)
        .get('/api/dashboard/vistorias-recentes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

