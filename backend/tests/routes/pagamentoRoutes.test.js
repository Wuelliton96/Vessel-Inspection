const request = require('supertest');
const { sequelize, LotePagamento, VistoriaLotePagamento, Vistoria, Usuario } = require('../../models');
const pagamentoRoutes = require('../../routes/pagamentoRoutes');
const { setupCompleteTestEnvironment, createTestApp, createTestVistoriaPadrao } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/pagamentos', router: pagamentoRoutes });

describe('Rotas de Pagamentos - Testes Adicionais', () => {
  let adminToken;
  let admin, vistoriador;
  let vistoria;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('pagamento');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoria = await createTestVistoriaPadrao();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await VistoriaLotePagamento.destroy({ where: {}, force: true });
    await LotePagamento.destroy({ where: {}, force: true });
  });

  describe('GET /api/pagamentos - Filtros', () => {
    it('deve filtrar por status', async () => {
      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        status: 'PENDENTE',
        valor_total: 1000,
        periodo_tipo: 'MENSAL'
      });

      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        status: 'PAGO',
        valor_total: 2000,
        periodo_tipo: 'MENSAL'
      });

      const response = await request(app)
        .get('/api/pagamentos?status=PENDENTE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(l => l.status === 'PENDENTE')).toBe(true);
    });

    it('deve filtrar por vistoriador_id', async () => {
      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        status: 'PENDENTE',
        valor_total: 1000,
        periodo_tipo: 'MENSAL'
      });

      const response = await request(app)
        .get(`/api/pagamentos?vistoriador_id=${vistoriador.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(l => l.vistoriador_id === vistoriador.id)).toBe(true);
    });

    it('deve incluir vistoriador na resposta', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        status: 'PENDENTE',
        valor_total: 1000,
        periodo_tipo: 'MENSAL'
      });

      const response = await request(app)
        .get('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const foundLote = response.body.find(l => l.id === lote.id);
      expect(foundLote).toBeDefined();
      expect(foundLote.vistoriador).toBeDefined();
    });
  });

  describe('GET /api/pagamentos/:id', () => {
    it('deve retornar lote com vistorias', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        status: 'PENDENTE',
        valor_total: 1000,
        periodo_tipo: 'MENSAL'
      });

      await VistoriaLotePagamento.create({
        lote_pagamento_id: lote.id,
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .get(`/api/pagamentos/${lote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(lote.id);
      expect(response.body).toHaveProperty('vistorias');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/pagamentos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/pagamentos', () => {
    it('deve criar lote de pagamento', async () => {
      const response = await request(app)
        .post('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vistoriador_id: vistoriador.id,
          periodo_tipo: 'MENSAL',
          data_inicio: '2024-01-01',
          data_fim: '2024-01-31',
          valor_total: 5000,
          vistorias: [vistoria.id]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.vistoriador_id).toBe(vistoriador.id);
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/pagamentos/:id/pagar', () => {
    it('deve marcar lote como pago', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        status: 'PENDENTE',
        valor_total: 1000,
        periodo_tipo: 'MENSAL'
      });

      const response = await request(app)
        .patch(`/api/pagamentos/${lote.id}/pagar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          data_pagamento: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('PAGO');
      expect(response.body.pago_por_id).toBe(admin.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .patch('/api/pagamentos/99999/pagar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ data_pagamento: new Date().toISOString() });

      expect(response.status).toBe(404);
    });
  });
});
