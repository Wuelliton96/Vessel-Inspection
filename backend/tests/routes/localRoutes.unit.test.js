/**
 * Testes unitários para localRoutes - sem dependência de banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mock dos modelos
jest.mock('../../models', () => ({
  Local: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  Vistoria: {
    count: jest.fn()
  },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true)
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

const { Local, Vistoria } = require('../../models');

describe('Local Routes - Unit Tests', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    const localRoutes = require('../../routes/localRoutes');
    app.use('/api/locais', localRoutes);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/locais', () => {
    it('deve listar locais com sucesso', async () => {
      const mockLocais = [
        { id: 1, nome_local: 'Marina 1', tipo: 'MARINA' },
        { id: 2, nome_local: 'Marina 2', tipo: 'MARINA' }
      ];
      
      Local.findAll.mockResolvedValue(mockLocais);
      
      const response = await request(app).get('/api/locais');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('deve filtrar locais por tipo', async () => {
      const mockLocais = [{ id: 1, nome_local: 'Marina 1', tipo: 'MARINA' }];
      
      Local.findAll.mockResolvedValue(mockLocais);
      
      const response = await request(app).get('/api/locais?tipo=MARINA');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar erro 500 em caso de falha', async () => {
      Local.findAll.mockRejectedValue(new Error('DB Error'));
      
      const response = await request(app).get('/api/locais');
      
      expect(response.status).toBe(500);
    });
  });
  
  describe('GET /api/locais/:id', () => {
    it('deve retornar local por ID', async () => {
      const mockLocal = { id: 1, nome_local: 'Marina Teste', tipo: 'MARINA' };
      
      Local.findByPk.mockResolvedValue(mockLocal);
      
      const response = await request(app).get('/api/locais/1');
      
      expect(response.status).toBe(200);
      expect(response.body.nome_local).toBe('Marina Teste');
    });
    
    it('deve retornar 404 para local inexistente', async () => {
      Local.findByPk.mockResolvedValue(null);
      
      const response = await request(app).get('/api/locais/999');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('POST /api/locais', () => {
    it('deve criar local com sucesso', async () => {
      const mockLocal = { id: 1, nome_local: 'Nova Marina', tipo: 'MARINA' };
      
      Local.create.mockResolvedValue(mockLocal);
      
      const response = await request(app)
        .post('/api/locais')
        .send({
          nome_local: 'Nova Marina',
          tipo: 'MARINA',
          cep: '12345678',
          cidade: 'Santos',
          estado: 'SP'
        });
      
      expect(response.status).toBe(201);
    });
    
    it('deve retornar 400 sem tipo', async () => {
      const response = await request(app)
        .post('/api/locais')
        .send({
          nome_local: 'Local Sem Tipo'
        });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('PUT /api/locais/:id', () => {
    it('deve atualizar local existente', async () => {
      const mockLocal = {
        id: 1,
        nome_local: 'Marina Original',
        update: jest.fn().mockResolvedValue(true)
      };
      
      Local.findByPk.mockResolvedValue(mockLocal);
      
      const response = await request(app)
        .put('/api/locais/1')
        .send({ nome_local: 'Marina Atualizada' });
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para local inexistente', async () => {
      Local.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/locais/999')
        .send({ nome_local: 'Teste' });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /api/locais/:id', () => {
    it('deve deletar local sem vistorias', async () => {
      const mockLocal = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      Local.findByPk.mockResolvedValue(mockLocal);
      Vistoria.count.mockResolvedValue(0);
      
      const response = await request(app).delete('/api/locais/1');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 400 para local com vistorias', async () => {
      const mockLocal = { id: 1 };
      
      Local.findByPk.mockResolvedValue(mockLocal);
      Vistoria.count.mockResolvedValue(5);
      
      const response = await request(app).delete('/api/locais/1');
      
      expect(response.status).toBe(400);
    });
    
    it('deve retornar 404 para local inexistente', async () => {
      Local.findByPk.mockResolvedValue(null);
      
      const response = await request(app).delete('/api/locais/999');
      
      expect(response.status).toBe(404);
    });
  });
});

