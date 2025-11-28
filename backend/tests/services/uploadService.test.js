const path = require('path');
const fs = require('fs');

// Mock do multer
jest.mock('multer', () => {
  const multer = jest.fn(() => ({
    single: jest.fn(),
    array: jest.fn(),
    fields: jest.fn()
  }));
  
  multer.diskStorage = jest.fn((config) => {
    return {
      destination: config.destination,
      filename: config.filename
    };
  });
  
  return multer;
});

// Mock do multer-s3
jest.mock('multer-s3', () => {
  return jest.fn(() => ({
    AUTO_CONTENT_TYPE: 'auto'
  }));
});

// Mock do AWS S3
const mockS3Client = {
  send: jest.fn()
};

jest.mock('../../config/aws', () => ({
  s3Client: mockS3Client,
  bucket: 'test-bucket',
  region: 'us-east-1'
}));

// Mock do imageCompress middleware
jest.mock('../../middleware/imageCompress', () => {
  return jest.fn(() => ({
    resize: jest.fn()
  }));
});

describe('Upload Service', () => {
  let uploadService;
  const originalEnv = process.env.UPLOAD_STRATEGY;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Criar diretório temporário se não existir
    const tempDir = path.join(__dirname, '../../uploads/fotos/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.UPLOAD_STRATEGY = originalEnv;
    } else {
      delete process.env.UPLOAD_STRATEGY;
    }
  });

  describe('getStorageInfo', () => {
    it('deve retornar informações do storage', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      const info = uploadService.getStorageInfo();
      
      expect(info).toBeDefined();
      expect(info.strategy).toBe('s3');
      expect(info.maxFileSize).toBe('10MB');
      expect(info.allowedTypes).toContain('JPEG');
      expect(info.location).toContain('AWS S3');
    });
  });

  describe('getUploadConfig', () => {
    it('deve retornar configuração do multer', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      expect(config).toBeDefined();
      expect(config.limits).toBeDefined();
      expect(config.limits.fileSize).toBe(10 * 1024 * 1024);
      expect(config.fileFilter).toBeDefined();
    });

    it('deve validar tipos de arquivo permitidos', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      const config = uploadService.getUploadConfig();
      
      const validFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg'
      };
      
      const invalidFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf'
      };
      
      let validResult = null;
      config.fileFilter(null, validFile, (error, accept) => {
        validResult = { error, accept };
      });
      
      expect(validResult.error).toBeNull();
      expect(validResult.accept).toBe(true);
      
      let invalidResult = null;
      config.fileFilter(null, invalidFile, (error, accept) => {
        invalidResult = { error, accept };
      });
      
      expect(invalidResult.error).toBeDefined();
      expect(invalidResult.error.message).toContain('Apenas imagens');
    });
  });

  describe('getFileUrl', () => {
    it('deve retornar a key do S3 para storage S3', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      
      const file = {
        key: 'vistorias/id-1/foto-123.jpg'
      };
      
      const url = uploadService.getFileUrl(file);
      expect(url).toBe('vistorias/id-1/foto-123.jpg');
    });

    it('deve retornar filename para storage local', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 'local';
      uploadService = require('../../services/uploadService');
      
      const file = {
        filename: 'foto-123.jpg'
      };
      
      const url = uploadService.getFileUrl(file);
      expect(url).toBe('foto-123.jpg');
    });
  });

  describe('getFullPath', () => {
    it('deve retornar URL pública do S3 para storage S3', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      
      const key = 'vistorias/id-1/foto-123.jpg';
      const vistoriaId = 1;
      
      const fullPath = uploadService.getFullPath(key, vistoriaId);
      expect(fullPath).toContain('amazonaws.com');
      expect(fullPath).toContain(key);
    });

    it('deve retornar URL completa se já for uma URL', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      
      const url = 'https://example.com/image.jpg';
      const vistoriaId = 1;
      
      const fullPath = uploadService.getFullPath(url, vistoriaId);
      expect(fullPath).toBe(url);
    });

    it('deve retornar caminho relativo para storage local', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 'local';
      uploadService = require('../../services/uploadService');
      
      const filename = 'foto-123.jpg';
      const vistoriaId = 1;
      
      const fullPath = uploadService.getFullPath(filename, vistoriaId);
      expect(fullPath).toBe('/uploads/fotos/vistoria-1/foto-123.jpg');
    });
  });

  describe('deleteFile', () => {
    it('deve deletar arquivo do S3', async () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      
      mockS3Client.send.mockResolvedValue({});
      
      const key = 'vistorias/id-1/foto-123.jpg';
      await uploadService.deleteFile(key);
      
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it('deve extrair key de URL completa do S3', async () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      
      mockS3Client.send.mockResolvedValue({});
      
      const url = 'https://test-bucket.s3.us-east-1.amazonaws.com/vistorias/id-1/foto-123.jpg';
      await uploadService.deleteFile(url);
      
      expect(mockS3Client.send).toHaveBeenCalled();
      const callArgs = mockS3Client.send.mock.calls[0][0];
      expect(callArgs.input.Key).toBe('vistorias/id-1/foto-123.jpg');
    });
  });
});

