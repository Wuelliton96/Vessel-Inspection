const request = require('supertest');
const { sequelize, Vistoria, Embarcacao, Local, StatusVistoria } = require('../../models');
const vistoriadorRoutes = require('../../routes/vistoriadorRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/vistoriador', router: vistoriadorRoutes });

describe('Rotas de Vistoriador', () => {
  let vistoriadorToken;
  let admin, vistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('vistoriador');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/vistoriador/vistorias', () => {
    it('deve listar vistorias do vistoriador', async () => {
      const status = await StatusVistoria.create({ nome: 'EM_ANDAMENTO', descricao: 'Em andamento' });
      const embarcacao = await Embarcacao.create({ nome: 'Barco Test', nr_inscricao_barco: 'TEST001' });
      const local = await Local.create({ tipo: 'MARINA', nome_local: 'Marina Test' });
      
      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: status.id
      });

      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/vistoriador/vistorias');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/vistoriador/vistorias/:id', () => {
    it('deve buscar vistoria específica do vistoriador', async () => {
      const status = await StatusVistoria.create({ nome: 'EM_ANDAMENTO', descricao: 'Em andamento' });
      const embarcacao = await Embarcacao.create({ nome: 'Barco Test', nr_inscricao_barco: 'TEST002' });
      const local = await Local.create({ tipo: 'MARINA', nome_local: 'Marina Test' });
      
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: status.id
      });

      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoria.id);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });
});

