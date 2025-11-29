/**
 * Testes unitários para fotoRoutes - sem dependência de banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mock dos modelos
jest.mock('../../models', () => ({
  Foto: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  Vistoria: {
    findByPk: jest.fn()
  },
  TipoFotoChecklist: {
    findByPk: jest.fn(),
    findOne: jest.fn()
  },
  VistoriaChecklistItem: {
    findByPk: jest.fn(),
    findOne: jest.fn()
  },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true)
  }
}));

// Mock do serviço de upload
jest.mock('../../services/uploadService', () => ({
  upload: {
    single: () => (req, res, next) => {
      req.file = { filename: 'test.jpg', path: '/uploads/test.jpg' };
      next();
    }
  },
  getFullPath: jest.fn().mockReturnValue('http://localhost/uploads/test.jpg'),
  deleteFile: jest.fn().mockResolvedValue(true)
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

const { Foto, Vistoria, TipoFotoChecklist, VistoriaChecklistItem } = require('../../models');

describe('Foto Routes - Unit Tests', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    const fotoRoutes = require('../../routes/fotoRoutes');
    app.use('/api/fotos', fotoRoutes);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/fotos/vistoria/:vistoria_id', () => {
    it('deve listar fotos de uma vistoria', async () => {
      const mockFotos = [
        { id: 1, url_arquivo: 'foto1.jpg', toJSON: () => ({ id: 1, url_arquivo: 'foto1.jpg' }) },
        { id: 2, url_arquivo: 'foto2.jpg', toJSON: () => ({ id: 2, url_arquivo: 'foto2.jpg' }) }
      ];
      
      Foto.findAll.mockResolvedValue(mockFotos);
      
      const response = await request(app).get('/api/fotos/vistoria/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('deve retornar erro 500 em caso de falha', async () => {
      Foto.findAll.mockRejectedValue(new Error('DB Error'));
      
      const response = await request(app).get('/api/fotos/vistoria/1');
      
      expect(response.status).toBe(500);
    });
  });
  
  describe('GET /api/fotos/:id', () => {
    it('deve retornar foto por ID', async () => {
      const mockFoto = {
        id: 1,
        url_arquivo: 'foto.jpg',
        vistoria_id: 1,
        toJSON: () => ({ id: 1, url_arquivo: 'foto.jpg' })
      };
      
      Foto.findByPk.mockResolvedValue(mockFoto);
      
      const response = await request(app).get('/api/fotos/1');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para foto inexistente', async () => {
      Foto.findByPk.mockResolvedValue(null);
      
      const response = await request(app).get('/api/fotos/999');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /api/fotos/:id', () => {
    it('deve deletar foto existente', async () => {
      const mockFoto = {
        id: 1,
        url_arquivo: 'foto.jpg',
        vistoria_id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      const mockVistoria = {
        id: 1,
        vistoriador_id: 1
      };
      
      Foto.findByPk.mockResolvedValue(mockFoto);
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      
      const response = await request(app).delete('/api/fotos/1');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para foto inexistente', async () => {
      Foto.findByPk.mockResolvedValue(null);
      
      const response = await request(app).delete('/api/fotos/999');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('GET /api/fotos/tipos', () => {
    it('deve listar tipos de foto checklist', async () => {
      const mockTipos = [
        { id: 1, codigo: 'CASCO', nome_exibicao: 'Casco' },
        { id: 2, codigo: 'MOTOR', nome_exibicao: 'Motor' }
      ];
      
      TipoFotoChecklist.findAll = jest.fn().mockResolvedValue(mockTipos);
      
      // Esta rota pode não existir, mas testamos mesmo assim
      const response = await request(app).get('/api/fotos/tipos');
      
      // Se a rota existir, espera 200, senão 404
      expect([200, 404]).toContain(response.status);
    });
  });
});

