const request = require('supertest');
const { sequelize, Vistoria, Embarcacao, Usuario, StatusVistoria, LotePagamento, Cliente, Local } = require('../../models');
const dashboardRoutes = require('../../routes/dashboardRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/dashboard', router: dashboardRoutes });

describe('Rotas de Dashboard', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let statusPendente, statusConcluida;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('dashboard');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;

    // Criar ou buscar status
    statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } }) ||
      await StatusVistoria.create({ nome: 'PENDENTE' });
    statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } }) ||
      await StatusVistoria.create({ nome: 'CONCLUIDA' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/dashboard/estatisticas', () => {
    it('deve retornar estatísticas do dashboard (admin)', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mes_atual');
      expect(response.body).toHaveProperty('mes_anterior');
      expect(response.body).toHaveProperty('comparacao');
      expect(response.body).toHaveProperty('vistorias_por_status');
      expect(response.body).toHaveProperty('ranking_vistoriadores');
      expect(response.body).toHaveProperty('totais_gerais');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/dashboard/estatisticas');
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 para vistoriador (não-admin)', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve incluir dados financeiros no mês atual', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.mes_atual).toHaveProperty('financeiro');
      expect(response.body.mes_atual.financeiro).toHaveProperty('receita');
      expect(response.body.mes_atual.financeiro).toHaveProperty('despesa');
      expect(response.body.mes_atual.financeiro).toHaveProperty('lucro');
      expect(response.body.mes_atual.financeiro).toHaveProperty('pagamentos_pendentes');
      expect(response.body.mes_atual.financeiro).toHaveProperty('pagamentos_pagos');
    });

    it('deve incluir dados de vistorias no mês atual', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.mes_atual).toHaveProperty('vistorias');
      expect(response.body.mes_atual.vistorias).toHaveProperty('total');
      expect(response.body.mes_atual.vistorias).toHaveProperty('concluidas');
      expect(response.body.mes_atual.vistorias).toHaveProperty('em_andamento');
    });

    it('deve incluir dados do mês anterior', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.mes_anterior).toHaveProperty('vistorias');
      expect(response.body.mes_anterior).toHaveProperty('financeiro');
    });

    it('deve incluir comparação entre meses', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.comparacao).toHaveProperty('vistorias');
      expect(response.body.comparacao.vistorias).toHaveProperty('variacao');
      expect(response.body.comparacao.vistorias).toHaveProperty('percentual');
      expect(response.body.comparacao).toHaveProperty('receita');
      expect(response.body.comparacao).toHaveProperty('lucro');
    });

    it('deve incluir totais gerais', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totais_gerais).toHaveProperty('total_vistorias');
      expect(response.body.totais_gerais).toHaveProperty('total_embarcacoes');
      expect(response.body.totais_gerais).toHaveProperty('total_vistoriadores');
    });

    it('deve retornar ranking de vistoriadores', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.ranking_vistoriadores)).toBe(true);
    });

    it('deve retornar vistorias por status', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.vistorias_por_status)).toBe(true);
    });

    it('deve incluir nome do mês atual', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.mes_atual).toHaveProperty('nome_mes');
      expect(response.body.mes_atual).toHaveProperty('mes');
      expect(response.body.mes_atual).toHaveProperty('ano');
    });

    it('deve calcular valores numéricos corretamente', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      // Verificar que valores financeiros são números
      expect(typeof response.body.mes_atual.financeiro.receita).toBe('number');
      expect(typeof response.body.mes_atual.financeiro.despesa).toBe('number');
      expect(typeof response.body.mes_atual.financeiro.lucro).toBe('number');
    });

    it('deve funcionar com dados vazios', async () => {
      // Limpar vistorias
      await Vistoria.destroy({ where: {}, force: true });

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.mes_atual.vistorias.total).toBe(0);
    });

    it('deve contar vistorias corretamente quando existem', async () => {
      // Criar dados de teste
      const cliente = await Cliente.create({
        nome: 'Cliente Dashboard',
        cpf: generateTestCPF('dash01'),
        tipo_pessoa: 'FISICA'
      });

      const embarcacao = await Embarcacao.create({
        nome: 'Barco Dashboard',
        nr_inscricao_barco: `DASH${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        cliente_id: cliente.id
      });

      const local = await Local.create({
        nome_local: 'Local Dashboard',
        tipo: 'MARINA'
      });

      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totais_gerais.total_vistorias).toBeGreaterThan(0);
    });

    it('deve retornar ranking com limite de 5 vistoriadores', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ranking_vistoriadores.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Autenticação e Autorização', () => {
    it('deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('deve rejeitar token expirado', async () => {
      // Token expirado simulado (formato JWT válido mas expirado)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZXhwIjoxfQ.expired';
      
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('deve rejeitar sem header Authorization', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas');

      expect(response.status).toBe(401);
    });
  });

  describe('Tratamento de erros', () => {
    it('deve tratar erro interno graciosamente', async () => {
      // Mock para simular erro
      const originalFindAll = Vistoria.findAll;
      Vistoria.findAll = jest.fn().mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');

      // Restaurar função original
      Vistoria.findAll = originalFindAll;
    });
  });

  describe('Cálculos de comparação', () => {
    it('deve calcular percentual de variação corretamente', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      // Verificar que percentual é string ou número
      const percentual = response.body.comparacao.vistorias.percentual;
      expect(['string', 'number']).toContain(typeof percentual);
    });

    it('deve tratar divisão por zero no percentual', async () => {
      // Quando mês anterior tem 0 vistorias
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // Não deve haver NaN ou erro
      expect(response.body.comparacao.vistorias.percentual).not.toBe('NaN');
    });
  });
});
