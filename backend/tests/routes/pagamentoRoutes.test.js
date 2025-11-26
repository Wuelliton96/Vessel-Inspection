const request = require('supertest');
const { sequelize } = require('../../models');
const pagamentoRoutes = require('../../routes/pagamentoRoutes');
const { setupCompleteTestEnvironment, createTestApp, createTestVistoriaCompleta } = require('../helpers/testHelpers');

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

  describe('GET /api/pagamentos', () => {
    it('deve listar lotes de pagamento (admin)', async () => {
      const response = await request(app)
        .get('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/pagamentos');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/pagamentos', () => {
    it('deve criar lote de pagamento (admin)', async () => {
      const { vistoria } = await createTestVistoriaPadrao(vistoriador, admin, {
        statusNome: 'CONCLUIDA',
        nrInscricao: 'TEST001'
      });

      const response = await request(app)
        .post('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
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
      const response = await request(app)
        .post('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });
});

