/**
 * Testes abrangentes para pagamentoRoutes
 * Objetivo: Aumentar cobertura de testes para > 75%
 */
const request = require('supertest');
const { sequelize, LotePagamento, VistoriaLotePagamento, Vistoria, Usuario, Embarcacao, StatusVistoria, NivelAcesso } = require('../../models');
const pagamentoRoutes = require('../../routes/pagamentoRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/pagamentos', router: pagamentoRoutes });

describe('Rotas de Pagamentos - Testes de Cobertura', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador, embarcacao, statusConcluida;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('pagamento');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;

    // Criar embarcação
    embarcacao = await Embarcacao.create({
      nome: 'Test Boat Pagamento',
      tipo_embarcacao: 'LANCHA',
      nr_inscricao_barco: `PAGTEST${Date.now()}`
    });

    // Criar status concluída
    statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
    if (!statusConcluida) {
      statusConcluida = await StatusVistoria.create({ nome: 'CONCLUIDA', descricao: 'Vistoria concluída' });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Limpar dados entre testes
    await VistoriaLotePagamento.destroy({ where: {}, force: true });
    await LotePagamento.destroy({ where: {}, force: true });
  });

  describe('GET /api/pagamentos', () => {
    it('deve listar todos os lotes de pagamento', async () => {
      // Criar lote
      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PENDENTE'
      });

      const response = await request(app)
        .get('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar por periodo_tipo', async () => {
      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PENDENTE'
      });

      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'SEMANAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-07'),
        quantidade_vistorias: 2,
        valor_total: 600,
        status: 'PENDENTE'
      });

      const response = await request(app)
        .get('/api/pagamentos?periodo_tipo=MENSAL')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(l => l.periodo_tipo === 'MENSAL')).toBe(true);
    });

    it('deve filtrar por status', async () => {
      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PENDENTE'
      });

      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-02-01'),
        data_fim: new Date('2024-02-28'),
        quantidade_vistorias: 3,
        valor_total: 900,
        status: 'PAGO'
      });

      const response = await request(app)
        .get('/api/pagamentos?status=PAGO')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(l => l.status === 'PAGO')).toBe(true);
    });

    it('deve filtrar por vistoriador_id', async () => {
      const response = await request(app)
        .get(`/api/pagamentos?vistoriador_id=${vistoriador.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/pagamentos');
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 para vistoriador (não admin)', async () => {
      const response = await request(app)
        .get('/api/pagamentos')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/pagamentos/:id', () => {
    it('deve buscar lote por id', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PENDENTE'
      });

      const response = await request(app)
        .get(`/api/pagamentos/${lote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(lote.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/pagamentos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve incluir vistorias vinculadas ao lote', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 1,
        valor_total: 300,
        status: 'PENDENTE'
      });

      const response = await request(app)
        .get(`/api/pagamentos/${lote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('vistorias');
    });
  });

  describe('POST /api/pagamentos/gerar', () => {
    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/pagamentos/gerar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatórios');
    });

    it('deve retornar 400 sem vistoriador_id', async () => {
      const response = await request(app)
        .post('/api/pagamentos/gerar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          periodo_tipo: 'MENSAL',
          data_inicio: '2024-01-01',
          data_fim: '2024-01-31'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 quando não há vistorias disponíveis', async () => {
      const response = await request(app)
        .post('/api/pagamentos/gerar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vistoriador_id: vistoriador.id,
          periodo_tipo: 'MENSAL',
          data_inicio: '2024-01-01',
          data_fim: '2024-01-31'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Não há vistorias disponíveis');
    });

    it('deve criar lote quando há vistorias disponíveis', async () => {
      // Criar vistoria com data_conclusao e valor_vistoriador
      const local = await sequelize.models.Local.create({
        tipo: 'MARINA',
        nome_local: 'Marina Pagamento Test'
      });

      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusConcluida.id,
        data_conclusao: new Date('2024-01-15'),
        valor_vistoriador: 300
      });

      const response = await request(app)
        .post('/api/pagamentos/gerar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vistoriador_id: vistoriador.id,
          periodo_tipo: 'MENSAL',
          data_inicio: '2024-01-01',
          data_fim: '2024-01-31'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.quantidade_vistorias).toBe(1);
    });
  });

  describe('PUT /api/pagamentos/:id/pagar', () => {
    it('deve marcar lote como pago', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PENDENTE'
      });

      const response = await request(app)
        .put(`/api/pagamentos/${lote.id}/pagar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          forma_pagamento: 'PIX',
          observacoes: 'Pagamento realizado'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('PAGO');
    });

    it('deve retornar 404 para lote inexistente', async () => {
      const response = await request(app)
        .put('/api/pagamentos/99999/pagar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para lote já pago', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PAGO',
        data_pagamento: new Date()
      });

      const response = await request(app)
        .put(`/api/pagamentos/${lote.id}/pagar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('já foi pago');
    });

    it('deve retornar 400 para lote cancelado', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'CANCELADO'
      });

      const response = await request(app)
        .put(`/api/pagamentos/${lote.id}/pagar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cancelado');
    });
  });

  describe('PUT /api/pagamentos/:id/cancelar', () => {
    it('deve cancelar lote pendente', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PENDENTE'
      });

      const response = await request(app)
        .put(`/api/pagamentos/${lote.id}/cancelar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('CANCELADO');
    });

    it('deve retornar 404 para lote inexistente', async () => {
      const response = await request(app)
        .put('/api/pagamentos/99999/cancelar')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para lote já pago', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PAGO',
        data_pagamento: new Date()
      });

      const response = await request(app)
        .put(`/api/pagamentos/${lote.id}/cancelar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('não é possível cancelar');
    });
  });

  describe('DELETE /api/pagamentos/:id', () => {
    it('deve excluir lote pendente', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PENDENTE'
      });

      const response = await request(app)
        .delete(`/api/pagamentos/${lote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });

    it('deve excluir lote cancelado', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'CANCELADO'
      });

      const response = await request(app)
        .delete(`/api/pagamentos/${lote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
    });

    it('deve retornar 404 para lote inexistente', async () => {
      const response = await request(app)
        .delete('/api/pagamentos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para lote já pago', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PAGO',
        data_pagamento: new Date()
      });

      const response = await request(app)
        .delete(`/api/pagamentos/${lote.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('não é possível excluir');
    });
  });

  describe('GET /api/pagamentos/vistoriador/:id/disponiveis', () => {
    it('deve buscar vistorias disponíveis para pagamento', async () => {
      const response = await request(app)
        .get(`/api/pagamentos/vistoriador/${vistoriador.id}/disponiveis`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('vistorias');
      expect(response.body).toHaveProperty('quantidade');
      expect(response.body).toHaveProperty('valor_total');
    });

    it('deve filtrar por data_inicio', async () => {
      const response = await request(app)
        .get(`/api/pagamentos/vistoriador/${vistoriador.id}/disponiveis?data_inicio=2024-01-01`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve filtrar por data_fim', async () => {
      const response = await request(app)
        .get(`/api/pagamentos/vistoriador/${vistoriador.id}/disponiveis?data_fim=2024-12-31`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve filtrar por período completo', async () => {
      const response = await request(app)
        .get(`/api/pagamentos/vistoriador/${vistoriador.id}/disponiveis?data_inicio=2024-01-01&data_fim=2024-12-31`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/pagamentos/resumo/geral', () => {
    it('deve retornar resumo geral de pagamentos', async () => {
      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-01-01'),
        data_fim: new Date('2024-01-31'),
        quantidade_vistorias: 5,
        valor_total: 1500,
        status: 'PENDENTE'
      });

      await LotePagamento.create({
        vistoriador_id: vistoriador.id,
        periodo_tipo: 'MENSAL',
        data_inicio: new Date('2024-02-01'),
        data_fim: new Date('2024-02-28'),
        quantidade_vistorias: 3,
        valor_total: 900,
        status: 'PAGO',
        data_pagamento: new Date()
      });

      const response = await request(app)
        .get('/api/pagamentos/resumo/geral')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pendente');
      expect(response.body).toHaveProperty('pago');
      expect(response.body.pendente).toHaveProperty('quantidade');
      expect(response.body.pendente).toHaveProperty('valor_total');
      expect(response.body.pago).toHaveProperty('quantidade');
      expect(response.body.pago).toHaveProperty('valor_total');
    });

    it('deve filtrar resumo por período', async () => {
      const response = await request(app)
        .get('/api/pagamentos/resumo/geral?periodo_inicio=2024-01-01&periodo_fim=2024-12-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});

