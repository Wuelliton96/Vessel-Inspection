const request = require('supertest');
const { sequelize, LotePagamento, VistoriaLotePagamento, Vistoria, Embarcacao, Local, StatusVistoria, Usuario, Cliente } = require('../../models');
const pagamentoRoutes = require('../../routes/pagamentoRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/pagamentos', router: pagamentoRoutes });

describe('Rotas de Pagamento', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let statusConcluida;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('pagamento');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;

    statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } }) ||
      await StatusVistoria.create({ nome: 'CONCLUIDA' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await VistoriaLotePagamento.destroy({ where: {} });
    await LotePagamento.destroy({ where: {} });
  });

  describe('GET /api/pagamentos', () => {
    it('admin deve listar lotes de pagamento', async () => {
      const response = await request(app)
        .get('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar por status', async () => {
      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date(),
        data_fim: new Date(),
        status: 'PENDENTE',
        valor_total: 100
      });

      const response = await request(app)
        .get('/api/pagamentos?status=PENDENTE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(l => l.status === 'PENDENTE')).toBe(true);
    });

    it('deve filtrar por vistoriador', async () => {
      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date(),
        data_fim: new Date(),
        status: 'PENDENTE',
        valor_total: 100
      });

      const response = await request(app)
        .get(`/api/pagamentos?vistoriador_id=${vistoriador.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(l => l.vistoriador_id === vistoriador.id)).toBe(true);
    });

    it('vistoriador não deve ter acesso', async () => {
      const response = await request(app)
        .get('/api/pagamentos')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/pagamentos');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/pagamentos/:id', () => {
    let lote;

    beforeEach(async () => {
      lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date(),
        data_fim: new Date(),
        status: 'PENDENTE',
        valor_total: 500
      });
    });

    it('deve retornar lote específico', async () => {
      const response = await request(app)
        .get(`/api/pagamentos/${lote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(lote.id);
      expect(response.body).toHaveProperty('vistoriador');
    });

    it('deve retornar 404 para lote inexistente', async () => {
      const response = await request(app)
        .get('/api/pagamentos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/pagamentos/gerar', () => {
    let vistoria, embarcacao, local;

    beforeEach(async () => {
      const cliente = await Cliente.create({
        nome: `Cliente Pag ${Date.now()}`,
        cpf: generateTestCPF(`pag${Date.now().toString().slice(-6)}`),
        tipo_pessoa: 'FISICA'
      });

      embarcacao = await Embarcacao.create({
        nome: 'Barco Pagamento',
        nr_inscricao_barco: `PAG${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        cliente_id: cliente.id
      });

      local = await Local.create({
        nome_local: 'Local Pagamento',
        tipo: 'MARINA'
      });

      vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: statusConcluida.id,
        data_conclusao: new Date(),
        valor_vistoriador: 150.00
      });
    });

    it('deve gerar lote de pagamento', async () => {
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 1);
      const dataFim = new Date();

      const response = await request(app)
        .post('/api/pagamentos/gerar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vistoriador_id: vistoriador.id,
          periodo_tipo: 'MENSAL',
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString()
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.vistoriador_id).toBe(vistoriador.id);
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/pagamentos/gerar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 se não houver vistorias disponíveis', async () => {
      // Criar lote com todas as vistorias disponíveis
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 1);
      const dataFim = new Date();

      await request(app)
        .post('/api/pagamentos/gerar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vistoriador_id: vistoriador.id,
          periodo_tipo: 'MENSAL',
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString()
        });

      // Tentar criar outro lote
      const response = await request(app)
        .post('/api/pagamentos/gerar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vistoriador_id: vistoriador.id,
          periodo_tipo: 'MENSAL',
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString()
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/pagamentos/:id/pagar', () => {
    let lote;

    beforeEach(async () => {
      lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date(),
        data_fim: new Date(),
        status: 'PENDENTE',
        valor_total: 500
      });
    });

    it('deve marcar lote como pago', async () => {
      const response = await request(app)
        .put(`/api/pagamentos/${lote.id}/pagar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          forma_pagamento: 'PIX',
          observacoes: 'Pagamento via PIX'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('PAGO');
      expect(response.body.data_pagamento).toBeTruthy();
    });

    it('deve retornar 400 se já estiver pago', async () => {
      await lote.update({ status: 'PAGO' });

      const response = await request(app)
        .put(`/api/pagamentos/${lote.id}/pagar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 se estiver cancelado', async () => {
      await lote.update({ status: 'CANCELADO' });

      const response = await request(app)
        .put(`/api/pagamentos/${lote.id}/pagar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 para lote inexistente', async () => {
      const response = await request(app)
        .put('/api/pagamentos/99999/pagar')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/pagamentos/:id/cancelar', () => {
    let lote;

    beforeEach(async () => {
      lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date(),
        data_fim: new Date(),
        status: 'PENDENTE',
        valor_total: 500
      });
    });

    it('deve cancelar lote pendente', async () => {
      const response = await request(app)
        .put(`/api/pagamentos/${lote.id}/cancelar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELADO');
    });

    it('deve retornar 400 se já estiver pago', async () => {
      await lote.update({ status: 'PAGO' });

      const response = await request(app)
        .put(`/api/pagamentos/${lote.id}/cancelar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 para lote inexistente', async () => {
      const response = await request(app)
        .put('/api/pagamentos/99999/cancelar')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/pagamentos/:id', () => {
    let lote;

    beforeEach(async () => {
      lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date(),
        data_fim: new Date(),
        status: 'PENDENTE',
        valor_total: 500
      });
    });

    it('deve excluir lote pendente', async () => {
      const response = await request(app)
        .delete(`/api/pagamentos/${lote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      const excluido = await LotePagamento.findByPk(lote.id);
      expect(excluido).toBeNull();
    });

    it('deve excluir lote cancelado', async () => {
      await lote.update({ status: 'CANCELADO' });

      const response = await request(app)
        .delete(`/api/pagamentos/${lote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });

    it('não deve excluir lote pago', async () => {
      await lote.update({ status: 'PAGO' });

      const response = await request(app)
        .delete(`/api/pagamentos/${lote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 para lote inexistente', async () => {
      const response = await request(app)
        .delete('/api/pagamentos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/pagamentos/vistoriador/:id/disponiveis', () => {
    it('deve listar vistorias disponíveis para pagamento', async () => {
      const response = await request(app)
        .get(`/api/pagamentos/vistoriador/${vistoriador.id}/disponiveis`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('vistorias');
      expect(response.body).toHaveProperty('quantidade');
      expect(response.body).toHaveProperty('valor_total');
    });

    it('deve filtrar por período', async () => {
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 1);
      const dataFim = new Date();

      const response = await request(app)
        .get(`/api/pagamentos/vistoriador/${vistoriador.id}/disponiveis`)
        .query({
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString()
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/pagamentos/resumo/geral', () => {
    beforeEach(async () => {
      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date(),
        data_fim: new Date(),
        status: 'PENDENTE',
        valor_total: 500
      });

      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date(),
        data_fim: new Date(),
        status: 'PAGO',
        valor_total: 1000
      });
    });

    it('deve retornar resumo geral de pagamentos', async () => {
      const response = await request(app)
        .get('/api/pagamentos/resumo/geral')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pendente');
      expect(response.body).toHaveProperty('pago');
      expect(response.body.pendente).toHaveProperty('quantidade');
      expect(response.body.pendente).toHaveProperty('valor_total');
    });
  });
});
