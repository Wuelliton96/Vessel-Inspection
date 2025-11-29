const request = require('supertest');
const { sequelize, AuditoriaLog } = require('../../models');
const auditoriaRoutes = require('../../routes/auditoriaRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/auditoria', router: auditoriaRoutes });

describe('Rotas de Auditoria', () => {
  let adminToken, vistoriadorToken;
  let admin;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('auditoria');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/auditoria/test', () => {
    it('deve retornar mensagem de teste', async () => {
      const response = await request(app).get('/api/auditoria/test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('funcionando');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/auditoria', () => {
    beforeEach(async () => {
      await AuditoriaLog.destroy({ where: {} });
      
      // Criar alguns logs de auditoria
      await AuditoriaLog.bulkCreate([
        {
          usuario_id: admin.id,
          acao: 'LOGIN',
          entidade: 'Usuario',
          entidade_id: admin.id,
          nivel_critico: false,
          ip_address: '127.0.0.1',
          detalhes: 'Login bem-sucedido'
        },
        {
          usuario_id: admin.id,
          acao: 'CREATE',
          entidade: 'Vistoria',
          entidade_id: 1,
          nivel_critico: false,
          ip_address: '127.0.0.1',
          detalhes: 'Vistoria criada'
        }
      ]);
    });

    it('admin deve listar logs de auditoria', async () => {
      const response = await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('deve retornar paginação', async () => {
      const response = await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });

    it('vistoriador não deve ter acesso', async () => {
      const response = await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/auditoria');
      expect(response.status).toBe(401);
    });

    it('deve limitar a 20 registros por padrão', async () => {
      const response = await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.logs.length).toBeLessThanOrEqual(20);
    });
  });

  describe('GET /api/auditoria/estatisticas', () => {
    it('admin deve obter estatísticas', async () => {
      const response = await request(app)
        .get('/api/auditoria/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('acoesPorTipo');
      expect(response.body).toHaveProperty('acoesCriticas');
      expect(response.body).toHaveProperty('totalAcoes');
    });

    it('vistoriador não deve ter acesso', async () => {
      const response = await request(app)
        .get('/api/auditoria/estatisticas')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve retornar valores numéricos', async () => {
      const response = await request(app)
        .get('/api/auditoria/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.totalAcoes).toBe('number');
      expect(typeof response.body.acoesCriticas).toBe('number');
    });
  });
});
