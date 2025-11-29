/**
 * Testes unitários para dashboardRoutes
 * Usa mocks para evitar dependência do banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mock sequelize
const mockSequelize = {
  fn: jest.fn((fn, col) => `${fn}(${col})`),
  col: jest.fn(col => col)
};

// Mock data
const mockVistoria = {
  id: 1,
  status_id: 1,
  vistoriador_id: 1,
  valor_vistoria: 500,
  valor_vistoriador: 200,
  StatusVistoria: { nome: 'PENDENTE' },
  vistoriador: { id: 1, nome: 'Vistoriador Test', email: 'test@test.com' },
  dataValues: {
    quantidade: 5,
    total_vistorias: 10,
    total_ganho: 1000
  }
};

// Mock models
jest.mock('../../models', () => ({
  Vistoria: {
    findAll: jest.fn(),
    count: jest.fn(),
    sum: jest.fn()
  },
  Embarcacao: {
    count: jest.fn()
  },
  Usuario: {
    count: jest.fn()
  },
  StatusVistoria: {},
  LotePagamento: {
    sum: jest.fn()
  }
}));

// Mock sequelize config
jest.mock('../../config/database', () => mockSequelize);

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, nome: 'Admin', NivelAcesso: { id: 1, nome: 'ADMIN' } };
    next();
  },
  requireAdmin: (req, res, next) => next()
}));

describe('dashboardRoutes - Testes Unitários', () => {
  let app;
  let models;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    jest.resetModules();
    models = require('../../models');
    
    const dashboardRoutes = require('../../routes/dashboardRoutes');
    app.use('/api/dashboard', dashboardRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/dashboard/estatisticas', () => {
    it('deve retornar estatísticas completas', async () => {
      // Mock todas as queries
      models.Vistoria.findAll.mockResolvedValue([mockVistoria]);
      models.Vistoria.count
        .mockResolvedValueOnce(10)  // vistoriasMesAtual
        .mockResolvedValueOnce(8)   // vistoriasMesAnterior
        .mockResolvedValueOnce(5)   // vistoriasConcluidasMesAtual
        .mockResolvedValueOnce(4)   // vistoriasConcluidasMesAnterior
        .mockResolvedValueOnce(100); // totalVistorias
      models.Vistoria.sum
        .mockResolvedValueOnce(5000)  // receitaMesAtual
        .mockResolvedValueOnce(4000)  // receitaMesAnterior
        .mockResolvedValueOnce(2000)  // despesaMesAtual
        .mockResolvedValueOnce(1500); // despesaMesAnterior
      models.Embarcacao.count.mockResolvedValue(50);
      models.Usuario.count.mockResolvedValue(10);
      models.LotePagamento.sum
        .mockResolvedValueOnce(1000)  // pagamentosPendentes
        .mockResolvedValueOnce(500);  // pagamentosPagos

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .expect(200);

      expect(response.body).toHaveProperty('mes_atual');
      expect(response.body).toHaveProperty('mes_anterior');
      expect(response.body).toHaveProperty('comparacao');
      expect(response.body).toHaveProperty('vistorias_por_status');
      expect(response.body).toHaveProperty('ranking_vistoriadores');
      expect(response.body).toHaveProperty('totais_gerais');
    });

    it('deve calcular lucro corretamente', async () => {
      models.Vistoria.findAll.mockResolvedValue([]);
      models.Vistoria.count.mockResolvedValue(0);
      models.Vistoria.sum
        .mockResolvedValueOnce(5000)  // receita
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(2000)  // despesa
        .mockResolvedValueOnce(0);
      models.Embarcacao.count.mockResolvedValue(0);
      models.Usuario.count.mockResolvedValue(0);
      models.LotePagamento.sum.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .expect(200);

      expect(response.body.mes_atual.financeiro.lucro).toBe(3000);
    });

    it('deve lidar com valores nulos', async () => {
      models.Vistoria.findAll.mockResolvedValue([]);
      models.Vistoria.count.mockResolvedValue(0);
      models.Vistoria.sum.mockResolvedValue(null);
      models.Embarcacao.count.mockResolvedValue(0);
      models.Usuario.count.mockResolvedValue(0);
      models.LotePagamento.sum.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .expect(200);

      expect(response.body.mes_atual.financeiro.receita).toBe(0);
      expect(response.body.mes_atual.financeiro.despesa).toBe(0);
      expect(response.body.mes_atual.financeiro.lucro).toBe(0);
    });

    it('deve calcular variação percentual corretamente', async () => {
      models.Vistoria.findAll.mockResolvedValue([]);
      models.Vistoria.count
        .mockResolvedValueOnce(10)  // mesAtual
        .mockResolvedValueOnce(5)   // mesAnterior
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      models.Vistoria.sum.mockResolvedValue(null);
      models.Embarcacao.count.mockResolvedValue(0);
      models.Usuario.count.mockResolvedValue(0);
      models.LotePagamento.sum.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .expect(200);

      // (10 - 5) / 5 * 100 = 100%
      expect(response.body.comparacao.vistorias.percentual).toBe('100.0');
    });

    it('deve lidar com mês anterior zerado', async () => {
      models.Vistoria.findAll.mockResolvedValue([]);
      models.Vistoria.count
        .mockResolvedValueOnce(10)  // mesAtual
        .mockResolvedValueOnce(0)   // mesAnterior = 0
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      models.Vistoria.sum.mockResolvedValue(null);
      models.Embarcacao.count.mockResolvedValue(0);
      models.Usuario.count.mockResolvedValue(0);
      models.LotePagamento.sum.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .expect(200);

      // Se mesAnterior = 0 e mesAtual > 0, percentual = 100
      expect(response.body.comparacao.vistorias.percentual).toBe(100);
    });

    it('deve lidar com ambos meses zerados', async () => {
      models.Vistoria.findAll.mockResolvedValue([]);
      models.Vistoria.count.mockResolvedValue(0);
      models.Vistoria.sum.mockResolvedValue(null);
      models.Embarcacao.count.mockResolvedValue(0);
      models.Usuario.count.mockResolvedValue(0);
      models.LotePagamento.sum.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .expect(200);

      expect(response.body.comparacao.vistorias.percentual).toBe(0);
    });

    it('deve mapear ranking de vistoriadores', async () => {
      const vistoriaComRanking = {
        ...mockVistoria,
        vistoriador: { id: 1, nome: 'Top Vistoriador', email: 'top@test.com' },
        dataValues: { total_vistorias: 15, total_ganho: 2000 }
      };
      
      models.Vistoria.findAll
        .mockResolvedValueOnce([mockVistoria]) // vistorias por status
        .mockResolvedValueOnce([vistoriaComRanking]); // ranking
      models.Vistoria.count.mockResolvedValue(0);
      models.Vistoria.sum.mockResolvedValue(null);
      models.Embarcacao.count.mockResolvedValue(0);
      models.Usuario.count.mockResolvedValue(0);
      models.LotePagamento.sum.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .expect(200);

      expect(response.body.ranking_vistoriadores[0]).toHaveProperty('nome');
      expect(response.body.ranking_vistoriadores[0]).toHaveProperty('total_vistorias');
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Vistoria.findAll.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .expect(500);

      expect(response.body.error).toContain('Erro');
    });

    it('deve lidar com vistoriador desconhecido no ranking', async () => {
      const vistoriaSemVistoriador = {
        ...mockVistoria,
        vistoriador: null,
        dataValues: { total_vistorias: 5, total_ganho: 500 }
      };
      
      models.Vistoria.findAll
        .mockResolvedValueOnce([mockVistoria])
        .mockResolvedValueOnce([vistoriaSemVistoriador]);
      models.Vistoria.count.mockResolvedValue(0);
      models.Vistoria.sum.mockResolvedValue(null);
      models.Embarcacao.count.mockResolvedValue(0);
      models.Usuario.count.mockResolvedValue(0);
      models.LotePagamento.sum.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .expect(200);

      expect(response.body.ranking_vistoriadores[0].nome).toBe('Desconhecido');
    });

    it('deve lidar com status desconhecido', async () => {
      const vistoriaSemStatus = {
        ...mockVistoria,
        StatusVistoria: null,
        dataValues: { quantidade: 3 }
      };
      
      models.Vistoria.findAll
        .mockResolvedValueOnce([vistoriaSemStatus])
        .mockResolvedValueOnce([]);
      models.Vistoria.count.mockResolvedValue(0);
      models.Vistoria.sum.mockResolvedValue(null);
      models.Embarcacao.count.mockResolvedValue(0);
      models.Usuario.count.mockResolvedValue(0);
      models.LotePagamento.sum.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .expect(200);

      expect(response.body.vistorias_por_status[0].status).toBe('Desconhecido');
    });
  });
});

