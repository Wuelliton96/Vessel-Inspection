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

  describe('GET /api/dashboard/estatisticas - Detalhes', () => {
    it('deve retornar estrutura completa de estatísticas', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mes_atual');
      expect(response.body).toHaveProperty('mes_anterior');
      expect(response.body).toHaveProperty('comparacao');
      expect(response.body).toHaveProperty('vistorias_por_status');
      expect(response.body).toHaveProperty('ranking_vistoriadores');
      expect(response.body).toHaveProperty('totais_gerais');
    });

    it('deve incluir dados financeiros no mês atual', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.mes_atual).toHaveProperty('financeiro');
      expect(response.body.mes_atual.financeiro).toHaveProperty('receita');
      expect(response.body.mes_atual.financeiro).toHaveProperty('despesa');
      expect(response.body.mes_atual.financeiro).toHaveProperty('lucro');
    });

    it('deve incluir dados de vistorias no mês atual', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.mes_atual).toHaveProperty('vistorias');
      expect(response.body.mes_atual.vistorias).toHaveProperty('total');
      expect(response.body.mes_atual.vistorias).toHaveProperty('concluidas');
    });

    it('deve incluir comparação entre meses', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.comparacao).toHaveProperty('vistorias');
      expect(response.body.comparacao).toHaveProperty('receita');
      expect(response.body.comparacao).toHaveProperty('lucro');
    });

    it('deve retornar 403 para não-admin', async () => {
      // Criar token de vistoriador
      const { createTestToken } = require('../helpers/testHelpers');
      const vistoriadorToken = await createTestToken({ nivelAcessoId: 2 });

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve tratar erros internos', async () => {
      // Mock para simular erro
      const originalFindAll = Vistoria.findAll;
      Vistoria.findAll = jest.fn().mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      Vistoria.findAll = originalFindAll;
    });
  });
});

