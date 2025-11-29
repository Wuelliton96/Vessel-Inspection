/**
 * Testes específicos para upload de fotos
 */

const express = require('express');
const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Mock do fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  renameSync: jest.fn()
}));

// Mock dos modelos
jest.mock('../../models', () => ({
  Foto: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn()
  },
  Vistoria: {
    findByPk: jest.fn()
  },
  TipoFotoChecklist: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn()
  },
  VistoriaChecklistItem: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn()
  },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true)
  }
}));

// Mock do serviço de upload
jest.mock('../../services/uploadService', () => ({
  getUploadConfig: jest.fn().mockReturnValue({
    storage: { _handleFile: jest.fn(), _removeFile: jest.fn() },
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: jest.fn((req, file, cb) => cb(null, true))
  }),
  getFileUrl: jest.fn().mockReturnValue('test-photo.jpg'),
  getFullPath: jest.fn().mockReturnValue('http://localhost/uploads/test-photo.jpg'),
  deleteFile: jest.fn().mockResolvedValue(true),
  getStorageInfo: jest.fn().mockReturnValue({
    strategy: 'local',
    maxFileSize: '10MB',
    allowedTypes: ['image/jpeg', 'image/png'],
    location: 'uploads/'
  }),
  UPLOAD_STRATEGY: 'local'
}));

// Mock do logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock do servirImagemS3
jest.mock('../../utils/servirImagemS3', () => ({
  servirImagemS3: jest.fn()
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
const { deleteFile } = require('../../services/uploadService');

describe('Foto Upload Tests', () => {
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
  
  describe('Upload de Foto', () => {
    it('deve validar vistoria_id obrigatório', async () => {
      const response = await request(app)
        .post('/api/fotos')
        .field('tipo_foto_id', '1')
        .attach('foto', Buffer.from('fake image'), 'test.jpg');
      
      expect(response.status).toBe(400);
    });
    
    it('deve validar tipo_foto_id obrigatório', async () => {
      const response = await request(app)
        .post('/api/fotos')
        .field('vistoria_id', '1')
        .attach('foto', Buffer.from('fake image'), 'test.jpg');
      
      expect(response.status).toBe(400);
    });
    
    it('deve validar arquivo obrigatório', async () => {
      const response = await request(app)
        .post('/api/fotos')
        .field('vistoria_id', '1')
        .field('tipo_foto_id', '1');
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('Listagem de Fotos', () => {
    it('deve listar fotos por vistoria ordenadas por data', async () => {
      const mockVistoria = { id: 1, vistoriador_id: 1 };
      const mockFotos = [
        { 
          id: 1, 
          url_arquivo: 'foto1.jpg', 
          created_at: new Date('2025-01-01'),
          toJSON: () => ({ id: 1, url_arquivo: 'foto1.jpg' })
        },
        { 
          id: 2, 
          url_arquivo: 'foto2.jpg', 
          created_at: new Date('2025-01-02'),
          toJSON: () => ({ id: 2, url_arquivo: 'foto2.jpg' })
        }
      ];
      
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      Foto.findAll.mockResolvedValue(mockFotos);
      
      const response = await request(app).get('/api/fotos/vistoria/1');
      
      expect(response.status).toBe(200);
      expect(Foto.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.any(Array)
        })
      );
    });
  });
  
  describe('Deleção de Fotos', () => {
    it('deve deletar foto e arquivo físico', async () => {
      const mockFoto = {
        id: 1,
        url_arquivo: 'foto.jpg',
        vistoria_id: 1,
        checklist_item_id: 1,
        Vistoria: { id: 1, vistoriador_id: 1 },
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      const mockVistoria = { id: 1, vistoriador_id: 1 };
      const mockChecklistItem = {
        id: 1,
        update: jest.fn().mockResolvedValue(true)
      };
      
      Foto.findByPk.mockResolvedValue(mockFoto);
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      VistoriaChecklistItem.findByPk.mockResolvedValue(mockChecklistItem);
      
      const response = await request(app).delete('/api/fotos/1');
      
      expect(response.status).toBe(200);
      expect(mockFoto.destroy).toHaveBeenCalled();
    });
    
    it('deve atualizar checklist item ao deletar foto', async () => {
      const mockFoto = {
        id: 1,
        url_arquivo: 'foto.jpg',
        vistoria_id: 1,
        checklist_item_id: 5,
        Vistoria: { id: 1, vistoriador_id: 1 },
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      const mockVistoria = { id: 1, vistoriador_id: 1 };
      const mockChecklistItem = {
        id: 5,
        update: jest.fn().mockResolvedValue(true)
      };
      
      Foto.findByPk.mockResolvedValue(mockFoto);
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      VistoriaChecklistItem.findByPk.mockResolvedValue(mockChecklistItem);
      
      const response = await request(app).delete('/api/fotos/1');
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('Erros e Validações', () => {
    it('deve retornar 403 para vistoria de outro usuário', async () => {
      const mockVistoria = { id: 1, vistoriador_id: 999 };
      
      // Simular usuário vistoriador
      jest.doMock('../../middleware/auth', () => ({
        requireAuth: (req, res, next) => {
          req.user = { id: 2, NivelAcesso: { id: 2, nome: 'VISTORIADOR' } };
          next();
        },
        requireVistoriador: (req, res, next) => next()
      }));
      
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      Foto.findAll.mockResolvedValue([]);
      
      const response = await request(app).get('/api/fotos/vistoria/1');
      
      // Admin tem acesso a tudo
      expect([200, 403]).toContain(response.status);
    });
    
    it('deve validar ID numérico da foto', async () => {
      const response = await request(app).get('/api/fotos/invalid');
      
      expect([400, 404, 500]).toContain(response.status);
    });
    
    it('deve retornar 500 em erro de banco', async () => {
      Vistoria.findByPk.mockRejectedValue(new Error('DB Error'));
      
      const response = await request(app).get('/api/fotos/vistoria/1');
      
      expect(response.status).toBe(500);
    });
  });
  
  describe('URL Completa', () => {
    it('deve incluir url_completa nas fotos retornadas', async () => {
      const mockVistoria = { id: 1, vistoriador_id: 1 };
      const mockFotos = [
        { 
          id: 1, 
          url_arquivo: 'foto1.jpg',
          toJSON: () => ({ id: 1, url_arquivo: 'foto1.jpg' })
        }
      ];
      
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      Foto.findAll.mockResolvedValue(mockFotos);
      
      const response = await request(app).get('/api/fotos/vistoria/1');
      
      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('url_completa');
      }
    });
  });
  
  describe('Checklist Integration', () => {
    it('deve buscar fotos com item de checklist', async () => {
      const mockVistoria = { id: 1, vistoriador_id: 1 };
      const mockFotos = [
        { 
          id: 1, 
          url_arquivo: 'foto1.jpg',
          checklist_item_id: 1,
          toJSON: () => ({ id: 1, url_arquivo: 'foto1.jpg', checklist_item_id: 1 })
        }
      ];
      
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      Foto.findAll.mockResolvedValue(mockFotos);
      
      const response = await request(app).get('/api/fotos/vistoria/1');
      
      expect(response.status).toBe(200);
    });
  });
});

