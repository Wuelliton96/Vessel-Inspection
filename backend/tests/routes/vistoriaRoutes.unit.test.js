/**
 * Testes unitários para vistoriaRoutes - sem dependência de banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mock dos modelos
jest.mock('../../models', () => ({
  Vistoria: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  Embarcacao: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  Local: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  StatusVistoria: {
    findOne: jest.fn(),
    findByPk: jest.fn()
  },
  Usuario: {
    findByPk: jest.fn()
  },
  Cliente: {
    findByPk: jest.fn()
  },
  Seguradora: {
    findByPk: jest.fn()
  },
  SeguradoraTipoEmbarcacao: {
    findOne: jest.fn()
  },
  Foto: {},
  Laudo: {},
  VistoriaChecklistItem: {},
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

const { Vistoria, Embarcacao, Local, StatusVistoria, Usuario } = require('../../models');

describe('Vistoria Routes - Unit Tests', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    const vistoriaRoutes = require('../../routes/vistoriaRoutes');
    app.use('/api/vistorias', vistoriaRoutes);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/vistorias', () => {
    it('deve listar vistorias com sucesso', async () => {
      const mockVistorias = [
        { id: 1, embarcacao_id: 1, local_id: 1, toJSON: () => ({ id: 1 }) },
        { id: 2, embarcacao_id: 2, local_id: 2, toJSON: () => ({ id: 2 }) }
      ];
      
      Vistoria.findAll.mockResolvedValue(mockVistorias);
      
      const response = await request(app).get('/api/vistorias');
      
      expect(response.status).toBe(200);
      expect(Vistoria.findAll).toHaveBeenCalled();
    });
    
    it('deve retornar erro 500 em caso de falha', async () => {
      Vistoria.findAll.mockRejectedValue(new Error('DB Error'));
      
      const response = await request(app).get('/api/vistorias');
      
      expect(response.status).toBe(500);
    });
  });
  
  describe('GET /api/vistorias/:id', () => {
    it('deve retornar vistoria por ID', async () => {
      const mockVistoria = {
        id: 1,
        embarcacao_id: 1,
        vistoriador_id: 1,
        toJSON: () => ({ id: 1, embarcacao_id: 1, vistoriador_id: 1 })
      };
      
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      
      const response = await request(app).get('/api/vistorias/1');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para vistoria inexistente', async () => {
      Vistoria.findByPk.mockResolvedValue(null);
      
      const response = await request(app).get('/api/vistorias/999');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('POST /api/vistorias', () => {
    it('deve criar vistoria com embarcação existente', async () => {
      const mockEmbarcacao = { id: 1, tipo_embarcacao: 'LANCHA' };
      const mockLocal = { id: 1 };
      const mockStatus = { id: 1 };
      const mockUsuario = { id: 2 };
      const mockVistoria = { 
        id: 1, 
        embarcacao_id: 1,
        reload: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, embarcacao_id: 1 })
      };
      
      Embarcacao.findByPk.mockResolvedValue(mockEmbarcacao);
      Local.findByPk.mockResolvedValue(mockLocal);
      StatusVistoria.findOne.mockResolvedValue(mockStatus);
      Usuario.findByPk.mockResolvedValue(mockUsuario);
      Vistoria.create.mockResolvedValue(mockVistoria);
      
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          embarcacao_id: 1,
          local_id: 1,
          vistoriador_id: 2
        });
      
      expect(response.status).toBe(201);
    });
    
    it('deve retornar 400 sem vistoriador_id', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          embarcacao_id: 1,
          local_id: 1
        });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('PUT /api/vistorias/:id', () => {
    it('deve atualizar vistoria existente', async () => {
      const mockVistoria = {
        id: 1,
        vistoriador_id: 1,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1 })
      };
      
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      
      const response = await request(app)
        .put('/api/vistorias/1')
        .send({ dados_rascunho: { campo: 'valor' } });
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para vistoria inexistente', async () => {
      Vistoria.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/vistorias/999')
        .send({ dados_rascunho: {} });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /api/vistorias/:id', () => {
    it('deve deletar vistoria pendente', async () => {
      const mockVistoria = {
        id: 1,
        StatusVistoria: { nome: 'PENDENTE' },
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      
      const response = await request(app).delete('/api/vistorias/1');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 403 para vistoria não pendente', async () => {
      const mockVistoria = {
        id: 1,
        StatusVistoria: { nome: 'EM_ANDAMENTO' }
      };
      
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      
      const response = await request(app).delete('/api/vistorias/1');
      
      expect(response.status).toBe(403);
    });
    
    it('deve retornar 404 para vistoria inexistente', async () => {
      Vistoria.findByPk.mockResolvedValue(null);
      
      const response = await request(app).delete('/api/vistorias/999');
      
      expect(response.status).toBe(404);
    });
  });
});

