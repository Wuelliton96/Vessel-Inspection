/**
 * Testes unitários para dashboardRoutes - sem dependência de banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mock dos modelos
jest.mock('../../models', () => ({
  Vistoria: {
    count: jest.fn(),
    findAll: jest.fn()
  },
  Embarcacao: {
    count: jest.fn()
  },
  Usuario: {
    count: jest.fn()
  },
  Cliente: {
    count: jest.fn()
  },
  Local: {
    count: jest.fn()
  },
  StatusVistoria: {
    findAll: jest.fn()
  },
  Laudo: {
    count: jest.fn()
  },
  Foto: {
    count: jest.fn()
  },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([])
  }
}));

// Mock do middleware de autenticação
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, NivelAcesso: { id: 1, nome: 'ADMINISTRADOR' } };
    req.userInfo = { userId: 1 };
    next();
  },
  requireAdmin: (req, res, next) => next(),
  requireVistoriador: (req, res, next) => next()
}));

const { Vistoria, Embarcacao, Usuario, Cliente, StatusVistoria, Laudo, Foto } = require('../../models');

describe('Dashboard Routes - Unit Tests', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    const dashboardRoutes = require('../../routes/dashboardRoutes');
    app.use('/api/dashboard', dashboardRoutes);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/dashboard/estatisticas', () => {
    it('deve retornar estatísticas gerais', async () => {
      Vistoria.count.mockResolvedValue(50);
      Embarcacao.count.mockResolvedValue(30);
      Usuario.count.mockResolvedValue(10);
      Cliente.count.mockResolvedValue(25);
      Laudo.count.mockResolvedValue(20);
      
      const response = await request(app).get('/api/dashboard/estatisticas');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalVistorias');
    });
    
    it('deve retornar erro 500 em caso de falha', async () => {
      Vistoria.count.mockRejectedValue(new Error('DB Error'));
      
      const response = await request(app).get('/api/dashboard/estatisticas');
      
      expect(response.status).toBe(500);
    });
  });
  
  describe('GET /api/dashboard/vistorias-por-status', () => {
    it('deve retornar vistorias agrupadas por status', async () => {
      const mockStatus = [
        { id: 1, nome: 'PENDENTE', descricao: 'Pendente' },
        { id: 2, nome: 'EM_ANDAMENTO', descricao: 'Em andamento' },
        { id: 3, nome: 'CONCLUIDA', descricao: 'Concluída' }
      ];
      
      StatusVistoria.findAll.mockResolvedValue(mockStatus);
      Vistoria.count.mockResolvedValue(10);
      
      const response = await request(app).get('/api/dashboard/vistorias-por-status');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('deve retornar erro 500 em caso de falha', async () => {
      StatusVistoria.findAll.mockRejectedValue(new Error('DB Error'));
      
      const response = await request(app).get('/api/dashboard/vistorias-por-status');
      
      expect(response.status).toBe(500);
    });
  });
  
  describe('GET /api/dashboard/vistorias-recentes', () => {
    it('deve retornar vistorias recentes', async () => {
      const mockVistorias = [
        { id: 1, created_at: new Date(), toJSON: () => ({ id: 1 }) },
        { id: 2, created_at: new Date(), toJSON: () => ({ id: 2 }) }
      ];
      
      Vistoria.findAll.mockResolvedValue(mockVistorias);
      
      const response = await request(app).get('/api/dashboard/vistorias-recentes');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('deve aceitar parâmetro limit', async () => {
      Vistoria.findAll.mockResolvedValue([]);
      
      const response = await request(app).get('/api/dashboard/vistorias-recentes?limit=5');
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('GET /api/dashboard/vistorias-por-mes', () => {
    it('deve retornar vistorias por mês', async () => {
      const mockData = [
        { mes: '2025-01', total: 10 },
        { mes: '2025-02', total: 15 }
      ];
      
      Vistoria.findAll.mockResolvedValue(mockData);
      
      const response = await request(app).get('/api/dashboard/vistorias-por-mes');
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('GET /api/dashboard/resumo-vistoriador', () => {
    it('deve retornar resumo do vistoriador', async () => {
      Vistoria.count.mockResolvedValue(5);
      Vistoria.findAll.mockResolvedValue([]);
      
      const response = await request(app).get('/api/dashboard/resumo-vistoriador');
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('GET /api/dashboard/totais', () => {
    it('deve retornar totais gerais', async () => {
      Vistoria.count.mockResolvedValue(100);
      Embarcacao.count.mockResolvedValue(50);
      Cliente.count.mockResolvedValue(30);
      Usuario.count.mockResolvedValue(10);
      
      const response = await request(app).get('/api/dashboard/totais');
      
      expect(response.status).toBe(200);
    });
  });
});

