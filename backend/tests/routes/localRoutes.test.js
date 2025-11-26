const request = require('supertest');
const { sequelize, Local } = require('../../models');
const localRoutes = require('../../routes/localRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/locais', router: localRoutes });

describe('Rotas de Locais', () => {
  let vistoriadorToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('local');
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/locais', () => {
    it('deve listar todos os locais', async () => {
      await Local.create({ tipo: 'MARINA', nome_local: 'Marina Teste' });
      
      const response = await request(app)
        .get('/api/locais')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/locais');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/locais', () => {
    it('deve criar local', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          tipo: 'MARINA',
          nome_local: 'Nova Marina',
          cidade: 'Santos',
          estado: 'SP'
        });

      expect(response.status).toBe(201);
      expect(response.body.nome_local).toBe('Nova Marina');
    });

    it('deve retornar 400 sem tipo', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome_local: 'Sem Tipo' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/locais/:id', () => {
    it('deve atualizar local', async () => {
      const local = await Local.create({ tipo: 'MARINA', nome_local: 'Original' });
      
      const response = await request(app)
        .put(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome_local: 'Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.nome_local).toBe('Atualizado');
    });
  });

  describe('DELETE /api/locais/:id', () => {
    it('deve deletar local', async () => {
      const local = await Local.create({ tipo: 'RESIDENCIA' });
      
      const response = await request(app)
        .delete(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });
  });
});

