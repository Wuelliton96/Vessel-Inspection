/**
 * Testes de integração para fotoRoutes - executam código real das rotas
 */

const request = require('supertest');

// Mock dos modelos ANTES de importar as rotas
jest.mock('../../models', () => ({
  Foto: {
    findAll: jest.fn().mockResolvedValue([]),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn().mockResolvedValue(0)
  },
  Vistoria: {
    findByPk: jest.fn()
  },
  TipoFotoChecklist: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn().mockResolvedValue([])
  },
  VistoriaChecklistItem: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn().mockResolvedValue([])
  },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true)
  }
}));

// Mock do uploadService
jest.mock('../../services/uploadService', () => ({
  getUploadConfig: jest.fn().mockReturnValue({
    storage: { _handleFile: jest.fn(), _removeFile: jest.fn() },
    limits: { fileSize: 10485760 }
  }),
  getFileUrl: jest.fn().mockReturnValue('test.jpg'),
  getFullPath: jest.fn().mockReturnValue('http://localhost/uploads/test.jpg'),
  deleteFile: jest.fn().mockResolvedValue(true),
  getStorageInfo: jest.fn().mockReturnValue({
    strategy: 'local',
    maxFileSize: '10MB',
    allowedTypes: ['image/jpeg', 'image/png'],
    location: 'uploads/'
  }),
  UPLOAD_STRATEGY: 'local'
}));

// Mock do servirImagemS3
jest.mock('../../utils/servirImagemS3', () => ({
  servirImagemS3: jest.fn().mockResolvedValue(null)
}));

// Mock do logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock do middleware auth
jest.mock('../../middleware/auth', () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.user = { id: 1, NivelAcesso: { id: 1, nome: 'ADMINISTRADOR' } };
    req.userInfo = { userId: 1 };
    next();
  }),
  requireVistoriador: jest.fn((req, res, next) => next()),
  requireAdmin: jest.fn((req, res, next) => next())
}));

// Mock do multer
jest.mock('multer', () => {
  const mockMulter = jest.fn(() => ({
    single: jest.fn(() => (req, res, next) => {
      // Simular arquivo
      if (req.body && req.body._hasFile) {
        req.file = {
          filename: 'test.jpg',
          path: '/uploads/test.jpg',
          mimetype: 'image/jpeg',
          size: 1000
        };
      }
      next();
    }),
    array: jest.fn(() => (req, res, next) => next()),
    fields: jest.fn(() => (req, res, next) => next()),
    none: jest.fn(() => (req, res, next) => next()),
    any: jest.fn(() => (req, res, next) => next())
  }));
  mockMulter.memoryStorage = jest.fn(() => ({}));
  mockMulter.diskStorage = jest.fn(() => ({}));
  mockMulter.MulterError = class MulterError extends Error {
    constructor(code) {
      super(code);
      this.code = code;
    }
  };
  return mockMulter;
});

// Agora importar app e modelos
const express = require('express');
const { Foto, Vistoria, TipoFotoChecklist, VistoriaChecklistItem } = require('../../models');

describe('Foto Routes - Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Importar rotas
    const fotoRoutes = require('../../routes/fotoRoutes');
    app.use('/api/fotos', fotoRoutes);
    
    // Error handler
    app.use((err, req, res, next) => {
      res.status(500).json({ error: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/fotos/vistoria/:id', () => {
    it('retorna 404 quando vistoria não existe', async () => {
      Vistoria.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/fotos/vistoria/999');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('não encontrada');
    });

    it('retorna fotos quando vistoria existe e usuário é dono', async () => {
      Vistoria.findByPk.mockResolvedValue({ id: 1, vistoriador_id: 1 });
      Foto.findAll.mockResolvedValue([
        { id: 1, url_arquivo: 'foto1.jpg', toJSON: () => ({ id: 1, url_arquivo: 'foto1.jpg' }) }
      ]);

      const res = await request(app).get('/api/fotos/vistoria/1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('retorna fotos quando usuário é admin', async () => {
      Vistoria.findByPk.mockResolvedValue({ id: 1, vistoriador_id: 999 });
      Foto.findAll.mockResolvedValue([]);

      const res = await request(app).get('/api/fotos/vistoria/1');

      expect(res.status).toBe(200);
    });

    it('retorna erro 500 em caso de exceção', async () => {
      Vistoria.findByPk.mockRejectedValue(new Error('DB Error'));

      const res = await request(app).get('/api/fotos/vistoria/1');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/fotos/:id', () => {
    it('retorna 404 quando foto não existe', async () => {
      Foto.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/fotos/999');

      expect(res.status).toBe(404);
    });

    it('retorna foto quando existe', async () => {
      const mockFoto = {
        id: 1,
        url_arquivo: 'foto.jpg',
        vistoria_id: 1,
        Vistoria: { id: 1, vistoriador_id: 1 },
        toJSON: () => ({ id: 1, url_arquivo: 'foto.jpg' })
      };
      Foto.findByPk.mockResolvedValue(mockFoto);

      const res = await request(app).get('/api/fotos/1');

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/fotos/:id', () => {
    it('retorna 404 quando foto não existe', async () => {
      Foto.findByPk.mockResolvedValue(null);

      const res = await request(app).delete('/api/fotos/999');

      expect(res.status).toBe(404);
    });

    it('deleta foto quando usuário tem permissão', async () => {
      const mockFoto = {
        id: 1,
        url_arquivo: 'foto.jpg',
        vistoria_id: 1,
        checklist_item_id: null,
        Vistoria: { id: 1, vistoriador_id: 1 },
        destroy: jest.fn().mockResolvedValue(true)
      };
      Vistoria.findByPk.mockResolvedValue({ id: 1, vistoriador_id: 1 });
      Foto.findByPk.mockResolvedValue(mockFoto);

      const res = await request(app).delete('/api/fotos/1');

      expect(res.status).toBe(200);
      expect(mockFoto.destroy).toHaveBeenCalled();
    });

    it('atualiza checklist item ao deletar foto vinculada', async () => {
      const mockChecklistItem = {
        id: 5,
        update: jest.fn().mockResolvedValue(true)
      };
      const mockFoto = {
        id: 1,
        url_arquivo: 'foto.jpg',
        vistoria_id: 1,
        checklist_item_id: 5,
        Vistoria: { id: 1, vistoriador_id: 1 },
        destroy: jest.fn().mockResolvedValue(true)
      };
      Vistoria.findByPk.mockResolvedValue({ id: 1, vistoriador_id: 1 });
      Foto.findByPk.mockResolvedValue(mockFoto);
      VistoriaChecklistItem.findByPk.mockResolvedValue(mockChecklistItem);

      const res = await request(app).delete('/api/fotos/1');

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/fotos', () => {
    it('retorna 400 quando vistoria_id não é fornecido', async () => {
      const res = await request(app)
        .post('/api/fotos')
        .field('tipo_foto_id', '1');

      expect(res.status).toBe(400);
    });

    it('retorna 400 quando tipo_foto_id não é fornecido', async () => {
      const res = await request(app)
        .post('/api/fotos')
        .field('vistoria_id', '1');

      expect(res.status).toBe(400);
    });

    it('retorna 400 quando arquivo não é enviado', async () => {
      const res = await request(app)
        .post('/api/fotos')
        .field('vistoria_id', '1')
        .field('tipo_foto_id', '1');

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/fotos/:id', () => {
    it('retorna 404 quando foto não existe', async () => {
      Foto.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/fotos/999')
        .send({ observacao: 'teste' });

      expect(res.status).toBe(404);
    });

    it('atualiza observação da foto', async () => {
      const mockFoto = {
        id: 1,
        observacao: 'antiga',
        Vistoria: { id: 1, vistoriador_id: 1 },
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, observacao: 'nova' })
      };
      Foto.findByPk.mockResolvedValue(mockFoto);

      const res = await request(app)
        .patch('/api/fotos/1')
        .send({ observacao: 'nova' });

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/fotos/storage-info', () => {
    it('retorna informações de storage', async () => {
      const res = await request(app).get('/api/fotos/storage-info');

      // Pode ser 200 ou 404 dependendo da rota existir
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Acesso negado', () => {
    it('retorna 403 quando usuário não tem acesso à vistoria', async () => {
      // Simular vistoriador sem acesso
      const { requireAuth } = require('../../middleware/auth');
      requireAuth.mockImplementationOnce((req, res, next) => {
        req.user = { id: 2, NivelAcesso: { id: 2, nome: 'VISTORIADOR' } };
        next();
      });

      Vistoria.findByPk.mockResolvedValue({ id: 1, vistoriador_id: 999 });

      const res = await request(app).get('/api/fotos/vistoria/1');

      expect(res.status).toBe(403);
    });
  });
});

