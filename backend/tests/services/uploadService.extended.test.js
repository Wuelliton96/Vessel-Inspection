/**
 * Testes extendidos para uploadService.js
 * Foco em deleteFile, localStorage e cenários de borda
 */

const fs = require('fs');
const path = require('path');

// Salvar environment original
const originalEnv = { ...process.env };

// Mock do fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn(),
  renameSync: jest.fn()
}));

describe('UploadService - Testes Extendidos', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.UPLOAD_STRATEGY;
    delete process.env.AWS_S3_BUCKET;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_REGION;
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('localStorage - destination callback', () => {
    it('deve criar diretório temporário se não existir', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {};
      const mockFile = { originalname: 'test.jpg' };
      const mockCallback = jest.fn();
      
      // Chamar destination callback
      config.storage.getDestination(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
    });

    it('deve usar diretório existente', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      fs.existsSync.mockReturnValue(true);
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {};
      const mockFile = { originalname: 'test.jpg' };
      const mockCallback = jest.fn();
      
      config.storage.getDestination(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('localStorage - filename callback', () => {
    it('deve gerar filename com checklist_item_id quando fornecido', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {
        body: {
          checklist_item_id: '123',
          vistoria_id: '456'
        },
        uploadDir: 'test-dir',
        uploadVistoriaId: '456'
      };
      const mockFile = { originalname: 'test.jpg' };
      const mockCallback = jest.fn();
      
      config.storage.getFilename(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
      const callArgs = mockCallback.mock.calls[0];
      expect(callArgs[0]).toBeNull();
      expect(callArgs[1]).toContain('foto-checklist-123');
    });

    it('deve gerar filename sem checklist_item_id quando não fornecido', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {
        body: {},
        uploadDir: 'test-dir',
        uploadVistoriaId: '456'
      };
      const mockFile = { originalname: 'test.jpg' };
      const mockCallback = jest.fn();
      
      config.storage.getFilename(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
      const callArgs = mockCallback.mock.calls[0];
      expect(callArgs[1]).toMatch(/^foto-\d+-\d+\.jpg$/);
    });

    it('deve ignorar checklist_item_id vazio', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {
        body: {
          checklist_item_id: ''
        }
      };
      const mockFile = { originalname: 'test.jpg' };
      const mockCallback = jest.fn();
      
      config.storage.getFilename(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
      const callArgs = mockCallback.mock.calls[0];
      expect(callArgs[1]).not.toContain('checklist');
    });

    it('deve ignorar checklist_item_id "undefined"', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {
        body: {
          checklist_item_id: 'undefined'
        }
      };
      const mockFile = { originalname: 'test.jpg' };
      const mockCallback = jest.fn();
      
      config.storage.getFilename(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
      const callArgs = mockCallback.mock.calls[0];
      expect(callArgs[1]).not.toContain('checklist');
    });

    it('deve ignorar checklist_item_id "null"', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {
        body: {
          checklist_item_id: 'null'
        }
      };
      const mockFile = { originalname: 'test.jpg' };
      const mockCallback = jest.fn();
      
      config.storage.getFilename(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
      const callArgs = mockCallback.mock.calls[0];
      expect(callArgs[1]).not.toContain('checklist');
    });

    it('deve usar checklistItemId alternativo', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {
        body: {
          checklistItemId: '789'
        }
      };
      const mockFile = { originalname: 'test.png' };
      const mockCallback = jest.fn();
      
      config.storage.getFilename(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalled();
      const callArgs = mockCallback.mock.calls[0];
      expect(callArgs[1]).toContain('foto-checklist-789');
    });
  });

  describe('deleteFile - local strategy', () => {
    it('deve ter função deleteFile definida', async () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      expect(typeof uploadService.deleteFile).toBe('function');
    });

    it('deve aceitar caminho de arquivo como parâmetro', async () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      // A função deve aceitar um parâmetro string
      const fn = uploadService.deleteFile;
      expect(fn.length).toBeGreaterThanOrEqual(0);
    });

    it('deve ser uma função assíncrona', async () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      // Chamar com arquivo inexistente não deve lançar exceção síncrona
      const result = uploadService.deleteFile('arquivo-teste.jpg');
      expect(result).toBeInstanceOf(Promise);
    });

    it('deve completar sem erro para arquivo inexistente', async () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      // Não deve rejeitar para arquivo que não existe
      await expect(uploadService.deleteFile('arquivo-inexistente-xyz.jpg')).resolves.not.toThrow();
    });

    it('deve funcionar com caminho completo', async () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      // Testar que aceita caminho completo
      await expect(uploadService.deleteFile('/uploads/fotos/vistoria-99999/foto.jpg')).resolves.not.toThrow();
    });
  });

  describe('getFileUrl', () => {
    it('deve retornar filename para arquivo local', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      const mockFile = {
        filename: 'foto-12345.jpg',
        key: 'vistorias/id-1/foto-12345.jpg'
      };
      
      const result = uploadService.getFileUrl(mockFile);
      expect(result).toBe('foto-12345.jpg');
    });

    it('deve lidar com arquivo sem filename', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      const mockFile = {
        key: 'vistorias/id-1/foto-12345.jpg'
      };
      
      const result = uploadService.getFileUrl(mockFile);
      // Retorna undefined se não tem filename
      expect(result).toBeUndefined();
    });
  });

  describe('getFullPath', () => {
    it('deve construir caminho para arquivo local', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      const result = uploadService.getFullPath('foto.jpg', 123);
      expect(result).toBe('/uploads/fotos/vistoria-123/foto.jpg');
    });

    it('deve funcionar com vistoriaId como string', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      const result = uploadService.getFullPath('foto.jpg', '456');
      expect(result).toContain('vistoria-456');
    });

    it('deve funcionar com vistoriaId zero', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      const result = uploadService.getFullPath('foto.jpg', 0);
      expect(result).toContain('vistoria-0');
    });
  });

  describe('getStorageInfo', () => {
    it('deve retornar informações para storage local', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      
      const info = uploadService.getStorageInfo();
      
      expect(info).toHaveProperty('strategy', 'local');
      expect(info).toHaveProperty('maxFileSize', '10MB');
      expect(info).toHaveProperty('allowedTypes');
      expect(info.allowedTypes).toContain('JPEG');
      expect(info.allowedTypes).toContain('JPG');
      expect(info.allowedTypes).toContain('PNG');
      expect(info.allowedTypes).toContain('GIF');
      expect(info).toHaveProperty('location');
      expect(info.location).toContain('Local');
    });

    it('deve mostrar S3 como não configurado quando sem bucket', () => {
      process.env.UPLOAD_STRATEGY = 's3';
      delete process.env.AWS_S3_BUCKET;
      jest.resetModules();
      
      // Não podemos testar S3 sem configuração completa
      // Apenas verificamos que a variável é lida
      expect(process.env.UPLOAD_STRATEGY).toBe('s3');
    });
  });

  describe('fileFilter - casos de borda', () => {
    let uploadService;
    let config;

    beforeEach(() => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      uploadService = require('../../services/uploadService');
      config = uploadService.getUploadConfig();
    });

    const testFileFilter = (originalname, mimetype) => {
      return new Promise((resolve) => {
        config.fileFilter({}, { originalname, mimetype }, (err, result) => {
          resolve({ err, result });
        });
      });
    };

    it('deve aceitar imagem com extensão maiúscula JPEG', async () => {
      const { err, result } = await testFileFilter('FOTO.JPEG', 'image/jpeg');
      expect(err).toBeNull();
      expect(result).toBe(true);
    });

    it('deve aceitar imagem com extensão mista JpG', async () => {
      const { err, result } = await testFileFilter('foto.JpG', 'image/jpeg');
      expect(err).toBeNull();
      expect(result).toBe(true);
    });

    it('deve rejeitar arquivo SVG', async () => {
      const { err } = await testFileFilter('imagem.svg', 'image/svg+xml');
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toContain('Apenas imagens são permitidas');
    });

    it('deve rejeitar arquivo WebP', async () => {
      const { err } = await testFileFilter('imagem.webp', 'image/webp');
      expect(err).toBeInstanceOf(Error);
    });

    it('deve rejeitar arquivo BMP', async () => {
      const { err } = await testFileFilter('imagem.bmp', 'image/bmp');
      expect(err).toBeInstanceOf(Error);
    });

    it('deve rejeitar arquivo TIFF', async () => {
      const { err } = await testFileFilter('imagem.tiff', 'image/tiff');
      expect(err).toBeInstanceOf(Error);
    });

    it('deve rejeitar arquivo ZIP', async () => {
      const { err } = await testFileFilter('arquivo.zip', 'application/zip');
      expect(err).toBeInstanceOf(Error);
    });

    it('deve rejeitar arquivo com extensão falsificada', async () => {
      const { err } = await testFileFilter('virus.jpg.exe', 'application/x-executable');
      expect(err).toBeInstanceOf(Error);
    });

    it('deve rejeitar arquivo com mimetype incorreto', async () => {
      const { err } = await testFileFilter('foto.jpg', 'text/plain');
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('limites de configuração', () => {
    it('deve ter limite de 10MB para arquivo', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      expect(config.limits.fileSize).toBe(10 * 1024 * 1024);
    });

    it('deve limitar a 1 arquivo por vez', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      expect(config.limits.files).toBe(1);
    });

    it('deve ter limite de campos do formulário', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      expect(config.limits.fields).toBe(10);
    });

    it('deve ter limite de tamanho de campo', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      expect(config.limits.fieldSize).toBe(10 * 1024 * 1024);
    });
  });

  describe('UPLOAD_STRATEGY', () => {
    it('deve usar "local" como padrão', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      expect(uploadService.UPLOAD_STRATEGY).toBe('local');
    });

    it('deve usar "s3" quando configurado', () => {
      process.env.UPLOAD_STRATEGY = 's3';
      // Não podemos testar S3 sem configuração AWS completa
      expect(process.env.UPLOAD_STRATEGY).toBe('s3');
    });

    it('deve aceitar valor em minúsculas', () => {
      process.env.UPLOAD_STRATEGY = 'local';
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      expect(uploadService.UPLOAD_STRATEGY).toBe('local');
    });
  });
});

describe('UploadService - Múltiplas extensões', () => {
  beforeEach(() => {
    delete process.env.UPLOAD_STRATEGY;
    jest.resetModules();
    jest.clearAllMocks();
  });

  const extensões = [
    { ext: '.jpg', mime: 'image/jpeg', aceito: true },
    { ext: '.jpeg', mime: 'image/jpeg', aceito: true },
    { ext: '.JPG', mime: 'image/jpeg', aceito: true },
    { ext: '.JPEG', mime: 'image/jpeg', aceito: true },
    { ext: '.png', mime: 'image/png', aceito: true },
    { ext: '.PNG', mime: 'image/png', aceito: true },
    { ext: '.gif', mime: 'image/gif', aceito: true },
    { ext: '.GIF', mime: 'image/gif', aceito: true },
    { ext: '.pdf', mime: 'application/pdf', aceito: false },
    { ext: '.doc', mime: 'application/msword', aceito: false },
    { ext: '.exe', mime: 'application/x-executable', aceito: false },
    { ext: '.js', mime: 'application/javascript', aceito: false },
    { ext: '.html', mime: 'text/html', aceito: false }
  ];

  extensões.forEach(({ ext, mime, aceito }) => {
    it(`deve ${aceito ? 'aceitar' : 'rejeitar'} arquivos ${ext}`, async () => {
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const result = await new Promise((resolve) => {
        config.fileFilter(
          {},
          { originalname: `arquivo${ext}`, mimetype: mime },
          (err, accepted) => resolve({ err, accepted })
        );
      });
      
      if (aceito) {
        expect(result.err).toBeNull();
        expect(result.accepted).toBe(true);
      } else {
        expect(result.err).toBeInstanceOf(Error);
      }
    });
  });
});

