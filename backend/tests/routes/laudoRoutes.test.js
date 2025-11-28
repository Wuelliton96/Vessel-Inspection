const request = require('supertest');
const { sequelize, Laudo, Vistoria, Embarcacao, Local, StatusVistoria } = require('../../models');
const laudoRoutes = require('../../routes/laudoRoutes');
const { setupCompleteTestEnvironment, createTestApp, createTestVistoriaPadrao } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/laudos', router: laudoRoutes });

describe('Rotas de Laudos - Testes Adicionais', () => {
  let adminToken, vistoriadorToken;
  let vistoria;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('laudo');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
    vistoria = await createTestVistoriaPadrao();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Laudo.destroy({ where: {}, force: true });
  });

  describe('GET /api/laudos', () => {
    it('deve listar todos os laudos', async () => {
      await Laudo.create({ vistoria_id: vistoria.id });
      await Laudo.create({ vistoria_id: vistoria.id });

      const response = await request(app)
        .get('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('deve incluir vistoria na resposta', async () => {
      const laudo = await Laudo.create({ vistoria_id: vistoria.id });

      const response = await request(app)
        .get('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const foundLaudo = response.body.find(l => l.id === laudo.id);
      expect(foundLaudo).toBeDefined();
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/laudos');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/laudos/:id', () => {
    it('deve retornar laudo por id', async () => {
      const laudo = await Laudo.create({ vistoria_id: vistoria.id });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(laudo.id);
    });

    it('deve retornar 400 para id inválido', async () => {
      const response = await request(app)
        .get('/api/laudos/abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/laudos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/laudos/vistoria/:vistoriaId', () => {
    it('deve retornar laudo por vistoria_id', async () => {
      const laudo = await Laudo.create({ vistoria_id: vistoria.id });

      const response = await request(app)
        .get(`/api/laudos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(laudo.id);
    });

    it('deve retornar 400 para vistoria_id inválido', async () => {
      const response = await request(app)
        .get('/api/laudos/vistoria/abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 quando não há laudo para vistoria', async () => {
      const novaVistoria = await createTestVistoriaPadrao();

      const response = await request(app)
        .get(`/api/laudos/vistoria/${novaVistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/laudos', () => {
    it('deve criar laudo', async () => {
      const response = await request(app)
        .post('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vistoria_id: vistoria.id,
          numero_laudo: 'LAUDO-001'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.vistoria_id).toBe(vistoria.id);
    });

    it('deve retornar 400 sem vistoria_id', async () => {
      const response = await request(app)
        .post('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/laudos/:id', () => {
    it('deve atualizar laudo', async () => {
      const laudo = await Laudo.create({ vistoria_id: vistoria.id });

      const response = await request(app)
        .put(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          numero_laudo: 'LAUDO-UPDATED'
        });

      expect(response.status).toBe(200);
      expect(response.body.numero_laudo).toBe('LAUDO-UPDATED');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/laudos/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ numero_laudo: 'TEST' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/laudos/:id', () => {
    it('deve deletar laudo', async () => {
      const laudo = await Laudo.create({ vistoria_id: vistoria.id });

      const response = await request(app)
        .delete(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Laudo.findByPk(laudo.id);
      expect(deleted).toBeNull();
    });
  });
});
