/**
 * Testes unitários para auditoriaRoutes
 * Usa mocks para evitar dependência do banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mock data
const mockLog = {
  id: 1,
  acao: 'CREATE',
  entidade: 'Usuario',
  entidade_id: 1,
  usuario_id: 1,
  dados_anteriores: null,
  dados_novos: { nome: 'Test' },
  nivel_critico: false,
  detalhes: 'Usuário criado',
  created_at: new Date()
};

// Mock AuditoriaLog
const mockAuditoriaLog = {
  findAll: jest.fn(),
  count: jest.fn()
};

// Mock models
jest.mock('../../models', () => ({
  AuditoriaLog: mockAuditoriaLog
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, nome: 'Admin', NivelAcesso: { id: 1, nome: 'ADMIN' } };
    next();
  },
  requireAdmin: (req, res, next) => next()
}));

describe('auditoriaRoutes - Testes Unitários', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    const auditoriaRoutes = require('../../routes/auditoriaRoutes');
    app.use('/api/auditoria', auditoriaRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/auditoria/test', () => {
    it('deve retornar mensagem de teste', async () => {
      const response = await request(app)
        .get('/api/auditoria/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('funcionando');
    });
  });

  describe('GET /api/auditoria', () => {
    it('deve retornar lista de logs', async () => {
      mockAuditoriaLog.findAll.mockResolvedValue([mockLog]);

      const response = await request(app)
        .get('/api/auditoria')
        .expect(200);

      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('pagination');
    });

    it('deve retornar array vazio se não houver logs', async () => {
      mockAuditoriaLog.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/auditoria')
        .expect(200);

      expect(response.body.logs).toEqual([]);
    });

    it('deve incluir informações de paginação', async () => {
      mockAuditoriaLog.findAll.mockResolvedValue([mockLog, mockLog]);

      const response = await request(app)
        .get('/api/auditoria')
        .expect(200);

      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });

    it('deve retornar 500 em caso de erro', async () => {
      mockAuditoriaLog.findAll.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .get('/api/auditoria')
        .expect(500);

      expect(response.body.error).toBe('Erro interno do servidor');
      expect(response.body).toHaveProperty('message');
    });

    it('deve incluir stack trace no erro', async () => {
      const error = new Error('DB Error');
      mockAuditoriaLog.findAll.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/auditoria')
        .expect(500);

      expect(response.body).toHaveProperty('stack');
    });
  });

  describe('GET /api/auditoria/estatisticas', () => {
    it('deve retornar estatísticas', async () => {
      mockAuditoriaLog.count.mockResolvedValue(100);

      const response = await request(app)
        .get('/api/auditoria/estatisticas')
        .expect(200);

      expect(response.body).toHaveProperty('totalAcoes');
      expect(response.body).toHaveProperty('acoesPorTipo');
      expect(response.body).toHaveProperty('acoesCriticas');
    });

    it('deve retornar arrays vazios para listas', async () => {
      mockAuditoriaLog.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/auditoria/estatisticas')
        .expect(200);

      expect(response.body.acoesPorTipo).toEqual([]);
      expect(response.body.usuariosMaisAtivos).toEqual([]);
    });

    it('deve retornar 500 em caso de erro', async () => {
      mockAuditoriaLog.count.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .get('/api/auditoria/estatisticas')
        .expect(500);

      expect(response.body.error).toBe('Erro interno');
    });
  });
});

