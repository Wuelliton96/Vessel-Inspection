const request = require('supertest');
const { sequelize, Local } = require('../../models');
const localRoutes = require('../../routes/localRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/locais', router: localRoutes });

describe('Rotas de Locais', () => {
  let adminToken, vistoriadorToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('local');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Local.destroy({ where: {}, force: true });
  });

  describe('GET /api/locais', () => {
    it('deve listar locais (admin)', async () => {
      await Local.create({ nome: 'Local 1', tipo: 'MARINA' });
      await Local.create({ nome: 'Local 2', tipo: 'PORTO' });

      const response = await request(app)
        .get('/api/locais')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('deve listar locais (vistoriador)', async () => {
      const response = await request(app)
        .get('/api/locais')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/locais');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/locais/:id', () => {
    it('deve retornar local por id', async () => {
      const local = await Local.create({
        nome: 'Test Local',
        tipo: 'MARINA'
      });

      const response = await request(app)
        .get(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(local.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/locais/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/locais', () => {
    it('deve criar local (admin)', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'New Local',
          tipo: 'PORTO'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('New Local');
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/locais/:id', () => {
    it('deve atualizar local (admin)', async () => {
      const local = await Local.create({
        nome: 'Old Local',
        tipo: 'MARINA'
      });

      const response = await request(app)
        .put(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Updated Local',
          tipo: 'PORTO'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Updated Local');
    });
  });

  describe('DELETE /api/locais/:id', () => {
    it('deve deletar local (admin)', async () => {
      const local = await Local.create({
        nome: 'To Delete',
        tipo: 'MARINA'
      });

      const response = await request(app)
        .delete(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Local.findByPk(local.id);
      expect(deleted).toBeNull();
    });
  });
});
