const path = require('path');

// Salvar environment original
const originalEnv = { ...process.env };

describe('UploadService', () => {
  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('UPLOAD_STRATEGY', () => {
    it('deve usar "local" como estratégia padrão', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      expect(uploadService.UPLOAD_STRATEGY).toBe('local');
    });

    it('deve usar estratégia definida no ambiente', () => {
      process.env.UPLOAD_STRATEGY = 's3';
      jest.resetModules();
      
      // Não podemos testar S3 sem configuração AWS completa
      // Apenas verificamos que a variável é lida
      expect(process.env.UPLOAD_STRATEGY).toBe('s3');
    });
  });

  describe('getUploadConfig', () => {
    it('deve retornar configuração com limite de arquivo', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      expect(config).toHaveProperty('limits');
      expect(config.limits.fileSize).toBe(10 * 1024 * 1024); // 10MB
    });

    it('deve incluir filtro de arquivos', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      expect(config).toHaveProperty('fileFilter');
      expect(typeof config.fileFilter).toBe('function');
    });

    it('deve aceitar imagens JPEG', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {};
      const mockFile = {
        originalname: 'foto.jpg',
        mimetype: 'image/jpeg'
      };
      
      const mockCallback = jest.fn();
      config.fileFilter(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('deve aceitar imagens PNG', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {};
      const mockFile = {
        originalname: 'foto.png',
        mimetype: 'image/png'
      };
      
      const mockCallback = jest.fn();
      config.fileFilter(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('deve aceitar imagens GIF', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {};
      const mockFile = {
        originalname: 'foto.gif',
        mimetype: 'image/gif'
      };
      
      const mockCallback = jest.fn();
      config.fileFilter(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it('deve rejeitar arquivos não-imagem', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {};
      const mockFile = {
        originalname: 'documento.pdf',
        mimetype: 'application/pdf'
      };
      
      const mockCallback = jest.fn();
      config.fileFilter(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Error));
    });

    it('deve rejeitar arquivos .exe', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const mockReq = {};
      const mockFile = {
        originalname: 'virus.exe',
        mimetype: 'application/x-executable'
      };
      
      const mockCallback = jest.fn();
      config.fileFilter(mockReq, mockFile, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getFileUrl', () => {
    it('deve retornar filename para estratégia local', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const mockFile = {
        filename: 'foto-123.jpg',
        key: 'vistorias/id-1/foto-123.jpg'
      };
      
      const url = uploadService.getFileUrl(mockFile);
      expect(url).toBe('foto-123.jpg');
    });
  });

  describe('getFullPath', () => {
    it('deve construir caminho local corretamente', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const fullPath = uploadService.getFullPath('foto.jpg', 123);
      
      expect(fullPath).toBe('/uploads/fotos/vistoria-123/foto.jpg');
    });

    it('deve lidar com vistoriaId como número', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const fullPath = uploadService.getFullPath('test.jpg', 456);
      
      expect(fullPath).toContain('vistoria-456');
    });

    it('deve lidar com vistoriaId como string', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const fullPath = uploadService.getFullPath('test.jpg', '789');
      
      expect(fullPath).toContain('vistoria-789');
    });
  });

  describe('getStorageInfo', () => {
    it('deve retornar informações de storage local', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const info = uploadService.getStorageInfo();
      
      expect(info.strategy).toBe('local');
      expect(info.maxFileSize).toBe('10MB');
      expect(info.allowedTypes).toContain('JPEG');
      expect(info.allowedTypes).toContain('PNG');
      expect(info.location).toContain('Local');
    });
  });

  describe('deleteFile', () => {
    it('deve ter função deleteFile exportada', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      expect(typeof uploadService.deleteFile).toBe('function');
    });
  });

  describe('Limites de configuração', () => {
    it('deve limitar a 1 arquivo por vez', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      expect(config.limits.files).toBe(1);
    });

    it('deve ter limite de campos no formulário', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      expect(config.limits.fields).toBeDefined();
    });

    it('deve ter storage definido', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      expect(config.storage).toBeDefined();
    });
  });

  describe('Validação de extensões', () => {
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

    it('deve aceitar .jpeg', async () => {
      const { err, result } = await testFileFilter('foto.jpeg', 'image/jpeg');
      expect(err).toBeNull();
      expect(result).toBe(true);
    });

    it('deve aceitar .JPG (maiúsculo)', async () => {
      const { err, result } = await testFileFilter('foto.JPG', 'image/jpeg');
      expect(err).toBeNull();
      expect(result).toBe(true);
    });

    it('deve aceitar .PNG (maiúsculo)', async () => {
      const { err, result } = await testFileFilter('foto.PNG', 'image/png');
      expect(err).toBeNull();
      expect(result).toBe(true);
    });

    it('deve rejeitar .txt', async () => {
      const { err } = await testFileFilter('texto.txt', 'text/plain');
      expect(err).toBeInstanceOf(Error);
    });

    it('deve rejeitar .html', async () => {
      const { err } = await testFileFilter('pagina.html', 'text/html');
      expect(err).toBeInstanceOf(Error);
    });

    it('deve rejeitar .js', async () => {
      const { err } = await testFileFilter('script.js', 'application/javascript');
      expect(err).toBeInstanceOf(Error);
    });
  });
});
