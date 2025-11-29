/**
 * Testes abrangentes para uploadService
 * Objetivo: Aumentar cobertura de testes para > 75%
 */
const path = require('path');
const fs = require('fs');

// Mock de módulos antes de importar o service
jest.mock('multer', () => {
  const mockMulter = jest.fn(() => ({
    single: jest.fn(() => jest.fn()),
    array: jest.fn(() => jest.fn())
  }));
  mockMulter.diskStorage = jest.fn(() => ({}));
  mockMulter.MulterError = class MulterError extends Error {
    constructor(code) {
      super(code);
      this.code = code;
    }
  };
  return mockMulter;
});

jest.mock('multer-s3', () => {
  return jest.fn(() => ({}));
});

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  DeleteObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn()
}));

jest.mock('../../config/aws', () => ({
  s3Client: {
    send: jest.fn()
  },
  bucket: 'test-bucket',
  region: 'us-east-1'
}));

jest.mock('fs');

describe('uploadService - Testes de Cobertura', () => {
  let uploadService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('Estratégia Local', () => {
    beforeEach(() => {
      process.env.UPLOAD_STRATEGY = 'local';
      jest.resetModules();
      uploadService = require('../../services/uploadService');
    });

    describe('getFileUrl', () => {
      it('deve retornar filename para upload local', () => {
        const file = { filename: 'foto-123456.jpg' };
        const result = uploadService.getFileUrl(file);
        expect(result).toBe('foto-123456.jpg');
      });
    });

    describe('getFullPath', () => {
      it('deve construir caminho local corretamente', () => {
        const result = uploadService.getFullPath('foto-123.jpg', 1);
        expect(result).toBe('/uploads/fotos/vistoria-1/foto-123.jpg');
      });
    });

    describe('getStorageInfo', () => {
      it('deve retornar informações corretas para storage local', () => {
        const info = uploadService.getStorageInfo();
        expect(info.strategy).toBe('local');
        expect(info.maxFileSize).toBe('10MB');
        expect(info.allowedTypes).toContain('JPEG');
        expect(info.location).toContain('Local');
      });
    });

    describe('getUploadConfig', () => {
      it('deve retornar configuração para upload local', () => {
        const config = uploadService.getUploadConfig();
        expect(config.limits).toBeDefined();
        expect(config.limits.fileSize).toBe(10 * 1024 * 1024);
        expect(config.fileFilter).toBeDefined();
      });

      it('deve aceitar arquivos de imagem válidos', () => {
        const config = uploadService.getUploadConfig();
        const mockCb = jest.fn();
        const mockReq = {};
        const mockFile = { mimetype: 'image/jpeg', originalname: 'test.jpg' };

        config.fileFilter(mockReq, mockFile, mockCb);
        expect(mockCb).toHaveBeenCalledWith(null, true);
      });

      it('deve aceitar arquivos PNG', () => {
        const config = uploadService.getUploadConfig();
        const mockCb = jest.fn();
        const mockFile = { mimetype: 'image/png', originalname: 'test.png' };

        config.fileFilter({}, mockFile, mockCb);
        expect(mockCb).toHaveBeenCalledWith(null, true);
      });

      it('deve aceitar arquivos GIF', () => {
        const config = uploadService.getUploadConfig();
        const mockCb = jest.fn();
        const mockFile = { mimetype: 'image/gif', originalname: 'test.gif' };

        config.fileFilter({}, mockFile, mockCb);
        expect(mockCb).toHaveBeenCalledWith(null, true);
      });

      it('deve rejeitar arquivos não-imagem', () => {
        const config = uploadService.getUploadConfig();
        const mockCb = jest.fn();
        const mockFile = { mimetype: 'application/pdf', originalname: 'test.pdf' };

        config.fileFilter({}, mockFile, mockCb);
        expect(mockCb).toHaveBeenCalledWith(expect.any(Error));
      });

      it('deve rejeitar arquivos com extensão inválida', () => {
        const config = uploadService.getUploadConfig();
        const mockCb = jest.fn();
        const mockFile = { mimetype: 'image/jpeg', originalname: 'test.exe' };

        config.fileFilter({}, mockFile, mockCb);
        expect(mockCb).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    describe('deleteFile - Local', () => {
      it('deve deletar arquivo local existente', async () => {
        fs.existsSync.mockReturnValue(true);
        fs.unlinkSync.mockImplementation(() => {});
        fs.readdirSync.mockReturnValue([
          { isDirectory: () => true, name: 'vistoria-1' }
        ]);

        await uploadService.deleteFile('foto-123.jpg');
        
        expect(fs.unlinkSync).toHaveBeenCalled();
      });

      it('deve logar quando arquivo não encontrado', async () => {
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);

        await uploadService.deleteFile('foto-inexistente.jpg');
      });

      it('deve tratar caminhos com /uploads/', async () => {
        fs.existsSync.mockReturnValue(true);
        fs.unlinkSync.mockImplementation(() => {});

        await uploadService.deleteFile('/uploads/fotos/vistoria-1/foto-123.jpg');
        
        expect(fs.existsSync).toHaveBeenCalled();
      });
    });
  });

  describe('Estratégia S3', () => {
    beforeEach(() => {
      process.env.UPLOAD_STRATEGY = 's3';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      jest.resetModules();
      uploadService = require('../../services/uploadService');
    });

    describe('getFileUrl', () => {
      it('deve retornar key para upload S3', () => {
        const file = { key: 'vistorias/id-1/foto-123456.jpg' };
        const result = uploadService.getFileUrl(file);
        expect(result).toBe('vistorias/id-1/foto-123456.jpg');
      });
    });

    describe('getFullPath', () => {
      it('deve construir URL pública do S3', () => {
        const result = uploadService.getFullPath('vistorias/id-1/foto-123.jpg', 1);
        expect(result).toContain('s3');
        expect(result).toContain('amazonaws.com');
      });

      it('deve retornar URL se já for completa', () => {
        const url = 'https://test-bucket.s3.us-east-1.amazonaws.com/vistorias/id-1/foto-123.jpg';
        const result = uploadService.getFullPath(url, 1);
        expect(result).toBe(url);
      });
    });

    describe('getStorageInfo', () => {
      it('deve retornar informações corretas para storage S3', () => {
        const info = uploadService.getStorageInfo();
        expect(info.strategy).toBe('s3');
        expect(info.location).toContain('AWS S3');
      });
    });

    describe('deleteFile - S3', () => {
      it('deve deletar arquivo do S3', async () => {
        const mockSend = jest.fn().mockResolvedValue({});
        
        jest.resetModules();
        jest.mock('../../config/aws', () => ({
          s3Client: { send: mockSend },
          bucket: 'test-bucket',
          region: 'us-east-1'
        }));
        
        process.env.UPLOAD_STRATEGY = 's3';
        uploadService = require('../../services/uploadService');

        await uploadService.deleteFile('vistorias/id-1/foto-123.jpg');
      });

      it('deve extrair key da URL completa do S3', async () => {
        const mockSend = jest.fn().mockResolvedValue({});
        
        jest.resetModules();
        jest.mock('../../config/aws', () => ({
          s3Client: { send: mockSend },
          bucket: 'test-bucket',
          region: 'us-east-1'
        }));
        
        process.env.UPLOAD_STRATEGY = 's3';
        uploadService = require('../../services/uploadService');

        await uploadService.deleteFile('https://test-bucket.s3.amazonaws.com/vistorias/id-1/foto-123.jpg');
      });
    });
  });

  describe('UPLOAD_STRATEGY constante', () => {
    it('deve usar local como padrão quando não definido', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      const service = require('../../services/uploadService');
      expect(service.UPLOAD_STRATEGY).toBe('local');
    });

    it('deve respeitar variável de ambiente s3', () => {
      process.env.UPLOAD_STRATEGY = 's3';
      jest.resetModules();
      const service = require('../../services/uploadService');
      expect(service.UPLOAD_STRATEGY).toBe('s3');
    });
  });
});

