const request = require('supertest');
const { sequelize, TipoFotoChecklist } = require('../../models');
const tipoFotoChecklistRoutes = require('../../routes/tipoFotoChecklistRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/tipos-foto-checklist', router: tipoFotoChecklistRoutes });

describe('Rotas de TipoFotoChecklist - Testes Adicionais', () => {
  let adminToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('tipoFoto');
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await TipoFotoChecklist.destroy({ where: {}, force: true });
  });

  describe('GET /api/tipos-foto-checklist/:id', () => {
    it('deve retornar tipo por id', async () => {
      const tipo = await TipoFotoChecklist.create({
        nome: 'Test Tipo'
      });

      const response = await request(app)
        .get(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(tipo.id);
      expect(response.body.nome).toBe('Test Tipo');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/tipos-foto-checklist/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/tipos-foto-checklist/:id', () => {
    it('deve atualizar tipo', async () => {
      const tipo = await TipoFotoChecklist.create({
        nome: 'Old Tipo'
      });

      const response = await request(app)
        .put(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Updated Tipo'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Updated Tipo');
    });
  });

  describe('DELETE /api/tipos-foto-checklist/:id', () => {
    it('deve deletar tipo', async () => {
      const tipo = await TipoFotoChecklist.create({
        nome: 'To Delete'
      });

      const response = await request(app)
        .delete(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await TipoFotoChecklist.findByPk(tipo.id);
      expect(deleted).toBeNull();
    });
  });
});
