const request = require('supertest');
const { sequelize, Usuario, Vistoria } = require('../../models');
const vistoriadorRoutes = require('../../routes/vistoriadorRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/vistoriadores', router: vistoriadorRoutes });

describe('Rotas de Vistoriadores - Testes Adicionais', () => {
  let adminToken, vistoriadorToken;
  let vistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('vistoriador');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
    vistoriador = setup.vistoriador;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/vistoriadores', () => {
    it('deve listar vistoriadores (admin)', async () => {
      const response = await request(app)
        .get('/api/vistoriadores')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/vistoriadores');
      expect(response.status).toBe(401);
    });

    it('deve exigir permissão de admin', async () => {
      const response = await request(app)
        .get('/api/vistoriadores')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/vistoriadores/:id', () => {
    it('deve retornar vistoriador por id', async () => {
      const response = await request(app)
        .get(`/api/vistoriadores/${vistoriador.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoriador.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/vistoriadores/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/vistoriadores/:id/vistorias', () => {
    it('deve retornar vistorias do vistoriador', async () => {
      const response = await request(app)
        .get(`/api/vistoriadores/${vistoriador.id}/vistorias`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 404 para vistoriador inexistente', async () => {
      const response = await request(app)
        .get('/api/vistoriadores/99999/vistorias')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/vistoriadores/:id/estatisticas', () => {
    it('deve retornar estatísticas do vistoriador', async () => {
      const response = await request(app)
        .get(`/api/vistoriadores/${vistoriador.id}/estatisticas`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_vistorias');
      expect(response.body).toHaveProperty('vistorias_concluidas');
    });
  });
});
