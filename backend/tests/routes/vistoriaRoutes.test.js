const request = require('supertest');
const { sequelize, Vistoria, Embarcacao, Local, StatusVistoria, Usuario } = require('../../models');
const vistoriaRoutes = require('../../routes/vistoriaRoutes');
const { setupCompleteTestEnvironment, createTestApp, createTestVistoriaPadrao, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/vistorias', router: vistoriaRoutes });

describe('Rotas de Vistorias - Testes Adicionais', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador, embarcacao, local, status;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('vistoria');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;

    embarcacao = await Embarcacao.create({
      nome: 'Test Boat',
      tipo: 'LANCHA',
      nr_inscricao_barco: 'TEST123'
    });

    local = await Local.create({
      nome: 'Test Local',
      tipo: 'MARINA'
    });

    status = await StatusVistoria.findOne();
    if (!status) {
      status = await StatusVistoria.create({ nome: 'PENDENTE' });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Vistoria.destroy({ where: {}, force: true });
  });

  describe('GET /api/vistorias', () => {
    it('deve listar vistorias com filtros', async () => {
      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: status.id
      });

      const response = await request(app)
        .get('/api/vistorias?status_id=' + status.id)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve incluir associações na resposta', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: status.id
      });

      const response = await request(app)
        .get('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const foundVistoria = response.body.find(v => v.id === vistoria.id);
      expect(foundVistoria).toBeDefined();
    });
  });

  describe('GET /api/vistorias/:id', () => {
    it('deve retornar vistoria por id', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: status.id
      });

      const response = await request(app)
        .get(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoria.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/vistorias/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/vistorias', () => {
    it('deve criar vistoria com embarcacao existente', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_id: local.id,
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.embarcacao_id).toBe(embarcacao.id);
    });

    it('deve criar vistoria com nova embarcacao', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_nome: 'Nova Embarcacao',
          embarcacao_nr_inscricao_barco: 'NEW123',
          embarcacao_tipo: 'IATE',
          local_id: local.id,
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('deve retornar 400 sem vistoriador_id', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_id: local.id
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem campos obrigatórios para nova embarcacao', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          local_id: local.id,
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve exigir permissão de admin', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_id: local.id,
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/vistorias/:id', () => {
    it('deve atualizar vistoria', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: status.id
      });

      const response = await request(app)
        .put(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          observacoes: 'Observações atualizadas'
        });

      expect(response.status).toBe(200);
      expect(response.body.observacoes).toBe('Observações atualizadas');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/vistorias/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ observacoes: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/vistorias/:id', () => {
    it('deve deletar vistoria', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: status.id
      });

      const response = await request(app)
        .delete(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Vistoria.findByPk(vistoria.id);
      expect(deleted).toBeNull();
    });
  });
});
