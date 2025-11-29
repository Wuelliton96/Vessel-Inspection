/**
 * Testes unitários para uploadService
 * Usa mocks para evitar dependência de sistema de arquivos e AWS
 * ATUALIZADO: Usa @aws-sdk/client-s3 (v3) em vez de aws-sdk (v2)
 */

// Salvar env original
const originalEnv = process.env;

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn()
}));

// Mock @aws-sdk/client-s3 (v3)
jest.mock('@aws-sdk/client-s3', () => ({
  DeleteObjectCommand: jest.fn().mockImplementation((params) => params),
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({})
  }))
}));

// Mock AWS config
jest.mock('../../config/aws', () => ({
  s3Client: {
    send: jest.fn().mockResolvedValue({})
  },
  bucket: 'test-bucket',
  region: 'us-east-1'
}));

// Mock multer
jest.mock('multer', () => {
  const mockDiskStorage = jest.fn(() => ({}));
  const multerMock = jest.fn(() => ({
    single: jest.fn(),
    array: jest.fn()
  }));
  
  multerMock.diskStorage = mockDiskStorage;
  multerMock.memoryStorage = jest.fn(() => ({}));
  
  return multerMock;
});

// Mock multer-s3
jest.mock('multer-s3', () => {
  const mockS3Storage = jest.fn(() => ({}));
  mockS3Storage.AUTO_CONTENT_TYPE = 'auto';
  return mockS3Storage;
});

// Mock imageCompress
jest.mock('../../middleware/imageCompress', () => {
  return jest.fn().mockReturnValue({
    pipe: jest.fn()
  });
});

// Mock path
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...args) => args.join('/')),
  basename: jest.fn(p => p.split('/').pop()),
  extname: jest.fn(p => {
    const match = p.match(/\.[^.]+$/);
    return match ? match[0] : '';
  })
}));

describe('uploadService - Testes Unitários', () => {
  let fs;
  let uploadService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Reset environment
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    
    fs = require('fs');
    
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('Local Storage Strategy', () => {
    beforeEach(() => {
      process.env.UPLOAD_STRATEGY = 'local';
      jest.resetModules();
      uploadService = require('../../services/uploadService');
    });

    describe('getFileUrl', () => {
      it('deve retornar URL do arquivo corretamente', () => {
        const file = { filename: 'test-image.jpg' };
        const url = uploadService.getFileUrl(file);
        expect(url).toBe('test-image.jpg');
      });
    });

    describe('getFullPath', () => {
      it('deve construir caminho completo para vistoria', () => {
        const pathResult = uploadService.getFullPath('foto.jpg', 1);
        expect(pathResult).toContain('vistoria-1');
        expect(pathResult).toContain('foto.jpg');
      });

      it('deve retornar caminho com vistoria id', () => {
        const pathResult = uploadService.getFullPath('foto.jpg', 123);
        expect(pathResult).toContain('vistoria-123');
      });
    });

    describe('getStorageInfo', () => {
      it('deve retornar informações de storage local', () => {
        const info = uploadService.getStorageInfo();
        expect(info.strategy).toBe('local');
        expect(info.maxFileSize).toBe('10MB');
        expect(info.allowedTypes).toContain('JPEG');
      });
    });

    describe('deleteFile', () => {
      it('deve deletar arquivo local existente com caminho /uploads/', async () => {
        fs.existsSync.mockReturnValue(true);
        fs.unlinkSync.mockImplementation(() => {});
        
        await uploadService.deleteFile('/uploads/fotos/vistoria-1/test.jpg');
        
        expect(fs.unlinkSync).toHaveBeenCalled();
      });

      it('deve buscar arquivo em diretórios de vistoria quando é só nome', async () => {
        // Primeira chamada para verificar se fotosDir existe: true
        // Segunda chamada para verificar se arquivo existe na pasta vistoria-1: true
        fs.existsSync.mockImplementation((path) => {
          if (path.includes('fotos') && !path.includes('vistoria-')) return true;
          if (path.includes('vistoria-1') && path.includes('test.jpg')) return true;
          return false;
        });
        
        fs.readdirSync.mockReturnValue([
          { name: 'vistoria-1', isDirectory: () => true },
          { name: 'vistoria-2', isDirectory: () => true }
        ]);
        
        fs.unlinkSync.mockImplementation(() => {});
        
        await uploadService.deleteFile('test.jpg');
        
        expect(fs.readdirSync).toHaveBeenCalled();
      });

      it('deve logar quando diretório de fotos não existe', async () => {
        fs.existsSync.mockReturnValue(false);
        
        await uploadService.deleteFile('arquivo-sem-caminho.jpg');
        
        // Não deve lançar erro, apenas logar
        expect(fs.unlinkSync).not.toHaveBeenCalled();
      });

      it('deve logar quando arquivo não encontrado em nenhuma pasta', async () => {
        fs.existsSync.mockImplementation((path) => {
          if (path.includes('fotos') && !path.includes('vistoria-')) return true;
          return false;
        });
        
        fs.readdirSync.mockReturnValue([
          { name: 'vistoria-1', isDirectory: () => true }
        ]);
        
        await uploadService.deleteFile('arquivo-inexistente.jpg');
        
        expect(fs.unlinkSync).not.toHaveBeenCalled();
      });

      it('deve logar quando arquivo não encontrado pelo caminho completo', async () => {
        fs.existsSync.mockReturnValue(false);
        
        await uploadService.deleteFile('/uploads/fotos/vistoria-1/inexistente.jpg');
        
        expect(fs.unlinkSync).not.toHaveBeenCalled();
      });

      it('deve lançar erro quando falha ao deletar', async () => {
        fs.existsSync.mockReturnValue(true);
        fs.unlinkSync.mockImplementation(() => {
          throw new Error('Permissão negada');
        });
        
        // A função captura e relança o erro
        await expect(uploadService.deleteFile('/uploads/fotos/vistoria-1/test.jpg'))
          .rejects.toThrow();
      });
    });
  });

  describe('S3 Storage Strategy', () => {
    beforeEach(() => {
      process.env.UPLOAD_STRATEGY = 's3';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';
      
      jest.resetModules();
      uploadService = require('../../services/uploadService');
    });

    describe('getFileUrl', () => {
      it('deve retornar key do arquivo S3', () => {
        const file = { key: 'vistorias/id-1/foto.jpg' };
        const url = uploadService.getFileUrl(file);
        expect(url).toBe('vistorias/id-1/foto.jpg');
      });
    });

    describe('getFullPath', () => {
      it('deve retornar URL já completa se começar com http', () => {
        const httpUrl = 'https://example.com/foto.jpg';
        const result = uploadService.getFullPath(httpUrl, 1);
        expect(result).toBe(httpUrl);
      });

      it('deve construir URL S3 completa', () => {
        const result = uploadService.getFullPath('vistorias/id-1/foto.jpg', 1);
        expect(result).toContain('s3');
        expect(result).toContain('amazonaws.com');
      });
    });

    describe('getStorageInfo', () => {
      it('deve retornar informações de storage S3', () => {
        const info = uploadService.getStorageInfo();
        expect(info.strategy).toBe('s3');
        expect(info.location).toContain('S3');
      });
    });

    describe('deleteFile', () => {
      it('deve deletar do S3 usando key direta', async () => {
        const { s3Client } = require('../../config/aws');
        
        await uploadService.deleteFile('vistorias/id-1/foto.jpg');
        
        expect(s3Client.send).toHaveBeenCalled();
      });

      it('deve extrair key de URL completa do S3', async () => {
        const { s3Client } = require('../../config/aws');
        
        const fullUrl = 'https://test-bucket.s3.amazonaws.com/vistorias/id-1/foto.jpg';
        await uploadService.deleteFile(fullUrl);
        
        expect(s3Client.send).toHaveBeenCalled();
      });

      it('deve lançar erro ao falhar deletar do S3', async () => {
        jest.resetModules();
        
        jest.mock('../../config/aws', () => ({
          s3Client: {
            send: jest.fn().mockRejectedValue(new Error('S3 Error'))
          },
          bucket: 'test-bucket',
          region: 'us-east-1'
        }));
        
        process.env.UPLOAD_STRATEGY = 's3';
        const s3Service = require('../../services/uploadService');
        
        await expect(s3Service.deleteFile('vistorias/id-1/foto.jpg'))
          .rejects.toThrow();
      });
    });
  });

  describe('Upload Configuration', () => {
    beforeEach(() => {
      process.env.UPLOAD_STRATEGY = 'local';
      jest.resetModules();
      uploadService = require('../../services/uploadService');
    });

    describe('getUploadConfig', () => {
      it('deve retornar configuração de upload', () => {
        const config = uploadService.getUploadConfig();
        expect(config).toHaveProperty('limits');
        expect(config).toHaveProperty('fileFilter');
        expect(config).toHaveProperty('storage');
      });

      it('deve ter limite de tamanho 10MB', () => {
        const config = uploadService.getUploadConfig();
        expect(config.limits.fileSize).toBe(10 * 1024 * 1024);
      });

      it('deve ter limite de 1 arquivo', () => {
        const config = uploadService.getUploadConfig();
        expect(config.limits.files).toBe(1);
      });

      it('deve ter limite de fieldSize', () => {
        const config = uploadService.getUploadConfig();
        expect(config.limits.fieldSize).toBe(10 * 1024 * 1024);
      });

      it('deve ter limite de 10 campos', () => {
        const config = uploadService.getUploadConfig();
        expect(config.limits.fields).toBe(10);
      });
    });

    describe('File Filter', () => {
      it('deve aceitar arquivos JPEG', () => {
        const config = uploadService.getUploadConfig();
        const cb = jest.fn();
        
        config.fileFilter({}, { mimetype: 'image/jpeg', originalname: 'photo.jpg' }, cb);
        
        expect(cb).toHaveBeenCalledWith(null, true);
      });

      it('deve aceitar arquivos JPG', () => {
        const config = uploadService.getUploadConfig();
        const cb = jest.fn();
        
        config.fileFilter({}, { mimetype: 'image/jpg', originalname: 'photo.jpg' }, cb);
        
        expect(cb).toHaveBeenCalledWith(null, true);
      });

      it('deve aceitar arquivos PNG', () => {
        const config = uploadService.getUploadConfig();
        const cb = jest.fn();
        
        config.fileFilter({}, { mimetype: 'image/png', originalname: 'photo.png' }, cb);
        
        expect(cb).toHaveBeenCalledWith(null, true);
      });

      it('deve aceitar arquivos GIF', () => {
        const config = uploadService.getUploadConfig();
        const cb = jest.fn();
        
        config.fileFilter({}, { mimetype: 'image/gif', originalname: 'photo.gif' }, cb);
        
        expect(cb).toHaveBeenCalledWith(null, true);
      });

      it('deve rejeitar arquivos não-imagem', () => {
        const config = uploadService.getUploadConfig();
        const cb = jest.fn();
        
        config.fileFilter({}, { mimetype: 'application/pdf', originalname: 'doc.pdf' }, cb);
        
        expect(cb).toHaveBeenCalledWith(expect.any(Error));
      });

      it('deve rejeitar executáveis', () => {
        const config = uploadService.getUploadConfig();
        const cb = jest.fn();
        
        config.fileFilter({}, { mimetype: 'application/x-executable', originalname: 'virus.exe' }, cb);
        
        expect(cb).toHaveBeenCalledWith(expect.any(Error));
      });

      it('deve rejeitar arquivo com mimetype correto mas extensão errada', () => {
        const config = uploadService.getUploadConfig();
        const cb = jest.fn();
        
        config.fileFilter({}, { mimetype: 'image/jpeg', originalname: 'file.exe' }, cb);
        
        expect(cb).toHaveBeenCalledWith(expect.any(Error));
      });

      it('deve tratar erro no fileFilter graciosamente', () => {
        const config = uploadService.getUploadConfig();
        const cb = jest.fn();
        
        // Passar arquivo mal formado
        config.fileFilter({}, { mimetype: null, originalname: null }, cb);
        
        expect(cb).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('UPLOAD_STRATEGY constant', () => {
    it('deve usar local por padrão', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      uploadService = require('../../services/uploadService');
      
      expect(uploadService.UPLOAD_STRATEGY).toBe('local');
    });

    it('deve respeitar variável de ambiente s3', () => {
      process.env.UPLOAD_STRATEGY = 's3';
      jest.resetModules();
      uploadService = require('../../services/uploadService');
      
      expect(uploadService.UPLOAD_STRATEGY).toBe('s3');
    });
  });
});
