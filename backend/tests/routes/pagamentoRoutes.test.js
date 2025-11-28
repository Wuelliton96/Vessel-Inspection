const request = require('supertest');
const { sequelize } = require('../../models');
const pagamentoRoutes = require('../../routes/pagamentoRoutes');
const { setupCompleteTestEnvironment, createTestApp, createTestVistoriaPadrao } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/pagamentos', router: pagamentoRoutes });

describe('Rotas de Pagamento', () => {
  let adminToken;
  let admin, vistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('pagamento');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const makeAuthenticatedRequest = (method, path, token = adminToken, data = null) => {
    const req = request(app)[method](path).set('Authorization', `Bearer ${token}`);
    return data ? req.send(data) : req;
  };

  const makeUnauthenticatedRequest = (method, path, data = null) => {
    const req = request(app)[method](path);
    return data ? req.send(data) : req;
  };

  describe('GET /api/pagamentos', () => {
    it('deve listar lotes de pagamento (admin)', async () => {
      const response = await makeAuthenticatedRequest('get', '/api/pagamentos');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await makeUnauthenticatedRequest('get', '/api/pagamentos');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/pagamentos', () => {
    it('deve criar lote de pagamento (admin)', async () => {
      const { vistoria } = await createTestVistoriaPadrao(vistoriador, admin, {
        statusNome: 'CONCLUIDA',
        nrInscricao: 'TEST001'
      });

      const response = await makeAuthenticatedRequest('post', '/api/pagamentos', adminToken, {
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: '2024-01-01',
        data_fim: '2024-01-31',
        vistoria_ids: [vistoria.id]
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await makeAuthenticatedRequest('post', '/api/pagamentos', adminToken, {});
      expect(response.status).toBe(400);
    });
  });
});

