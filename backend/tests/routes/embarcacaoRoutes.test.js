const request = require('supertest');
const { sequelize, Embarcacao, Cliente, Seguradora } = require('../../models');
const embarcacaoRoutes = require('../../routes/embarcacaoRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/embarcacoes', router: embarcacaoRoutes });

describe('Rotas de Embarcacoes', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('embarcacao');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Embarcacao.destroy({ where: {}, force: true });
  });

  describe('GET /api/embarcacoes', () => {
    it('deve listar embarcacoes (admin)', async () => {
      await Embarcacao.create({ nome: 'Boat 1', tipo: 'LANCHA' });
      await Embarcacao.create({ nome: 'Boat 2', tipo: 'IATE' });

      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('deve listar embarcacoes (vistoriador)', async () => {
      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/embarcacoes');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/embarcacoes/:id', () => {
    it('deve retornar embarcacao por id', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Test Boat',
        tipo: 'LANCHA'
      });

      const response = await request(app)
        .get(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(embarcacao.id);
      expect(response.body.nome).toBe('Test Boat');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/embarcacoes', () => {
    it('deve criar embarcacao (admin)', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'New Boat',
          tipo: 'IATE'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('New Boat');
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .send({ nome: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/embarcacoes/:id', () => {
    it('deve atualizar embarcacao (admin)', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Old Boat',
        tipo: 'LANCHA'
      });

      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Updated Boat',
          tipo: 'IATE'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Updated Boat');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/embarcacoes/:id', () => {
    it('deve deletar embarcacao (admin)', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'To Delete',
        tipo: 'LANCHA'
      });

      const response = await request(app)
        .delete(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Embarcacao.findByPk(embarcacao.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .delete('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
