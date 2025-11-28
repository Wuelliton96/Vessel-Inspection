const request = require('supertest');
const { sequelize, Seguradora } = require('../../models');
const seguradoraRoutes = require('../../routes/seguradoraRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/seguradoras', router: seguradoraRoutes });

describe('Rotas de Seguradoras - Testes Adicionais', () => {
  let adminToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('seguradora');
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Seguradora.destroy({ where: {}, force: true });
  });

  describe('GET /api/seguradoras/:id', () => {
    it('deve retornar seguradora por id', async () => {
      const seguradora = await Seguradora.create({
        nome: 'Test Seguradora',
        cnpj: '12345678901234'
      });

      const response = await request(app)
        .get(`/api/seguradoras/${seguradora.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(seguradora.id);
      expect(response.body.nome).toBe('Test Seguradora');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/seguradoras/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/seguradoras/:id', () => {
    it('deve atualizar seguradora', async () => {
      const seguradora = await Seguradora.create({
        nome: 'Old Seguradora',
        cnpj: '11111111111111'
      });

      const response = await request(app)
        .put(`/api/seguradoras/${seguradora.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Updated Seguradora',
          cnpj: '22222222222222'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Updated Seguradora');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/seguradoras/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/seguradoras/:id', () => {
    it('deve deletar seguradora', async () => {
      const seguradora = await Seguradora.create({
        nome: 'To Delete',
        cnpj: '33333333333333'
      });

      const response = await request(app)
        .delete(`/api/seguradoras/${seguradora.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Seguradora.findByPk(seguradora.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .delete('/api/seguradoras/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
