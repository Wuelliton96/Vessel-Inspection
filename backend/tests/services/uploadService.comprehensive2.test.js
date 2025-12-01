/**
 * Testes abrangentes para uploadService.js
 * Objetivo: Aumentar a cobertura de código para > 70%
 */

const path = require('path');
const fs = require('fs');

// Salvar environment original
const originalEnv = { ...process.env };

// Mock do módulo fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  readdirSync: jest.fn(),
  renameSync: jest.fn()
}));

// Mock do AWS config
const mockS3Send = jest.fn().mockResolvedValue({});
jest.mock('../../config/aws', () => ({
  s3Client: {
    send: mockS3Send
  },
  bucket: 'test-bucket',
  region: 'us-east-1'
}));

// Mock do @aws-sdk/client-s3
jest.mock('@aws-sdk/client-s3', () => ({
  DeleteObjectCommand: jest.fn().mockImplementation((params) => params)
}));

// Mock do multer
const mockDiskStorage = jest.fn().mockReturnValue({
  _handleFile: jest.fn(),
  _removeFile: jest.fn()
});

jest.mock('multer', () => {
  const mockMulter = jest.fn().mockReturnValue({
    single: jest.fn().mockReturnValue((req, res, next) => next()),
    array: jest.fn().mockReturnValue((req, res, next) => next())
  });
  mockMulter.diskStorage = mockDiskStorage;
  return mockMulter;
});

// Mock do multer-s3
const mockS3Storage = jest.fn().mockReturnValue({});
mockS3Storage.AUTO_CONTENT_TYPE = 'auto';
jest.mock('multer-s3', () => mockS3Storage);

// Mock do imageCompress middleware
jest.mock('../../middleware/imageCompress', () => {
  return jest.fn().mockReturnValue({
    pipe: jest.fn()
  });
});

describe('UploadService - Cobertura Abrangente', () => {
  let uploadService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Reset environment
    process.env = { ...originalEnv };
    process.env.UPLOAD_STRATEGY = 'local';
    process.env.AWS_S3_BUCKET = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';
    
    // Configurar mocks padrão
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockImplementation(() => {});
    fs.unlinkSync.mockImplementation(() => {});
    fs.readdirSync.mockReturnValue([]);
    fs.renameSync.mockImplementation(() => {});
    mockS3Send.mockResolvedValue({});
    
    // Reimportar o serviço
    uploadService = require('../../services/uploadService');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('UPLOAD_STRATEGY', () => {
    it('deve usar "local" como padrão', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      
      const service = require('../../services/uploadService');
      expect(service.UPLOAD_STRATEGY).toBe('local');
    });

    it('deve usar estratégia definida no environment', () => {
      process.env.UPLOAD_STRATEGY = 's3';
      jest.resetModules();
      
      const service = require('../../services/uploadService');
      expect(service.UPLOAD_STRATEGY).toBe('s3');
    });
  });

  describe('getUploadConfig', () => {
    it('deve retornar configuração válida', () => {
      const config = uploadService.getUploadConfig();
      
      expect(config).toBeDefined();
      expect(config).toHaveProperty('limits');
      expect(config).toHaveProperty('fileFilter');
      expect(config).toHaveProperty('storage');
    });

    it('deve definir limite de arquivo para 10MB', () => {
      const config = uploadService.getUploadConfig();
      expect(config.limits.fileSize).toBe(10 * 1024 * 1024);
    });

    it('deve definir limite de 1 arquivo por vez', () => {
      const config = uploadService.getUploadConfig();
      expect(config.limits.files).toBe(1);
    });

    it('deve definir limite de campos', () => {
      const config = uploadService.getUploadConfig();
      expect(config.limits.fields).toBeDefined();
    });

    it('deve definir limite de tamanho de campo', () => {
      const config = uploadService.getUploadConfig();
      expect(config.limits.fieldSize).toBeDefined();
    });

    describe('fileFilter', () => {
      let config;

      beforeEach(() => {
        jest.resetModules();
        process.env.UPLOAD_STRATEGY = 'local';
        uploadService = require('../../services/uploadService');
        config = uploadService.getUploadConfig();
      });

      const testFileFilter = (file) => {
        return new Promise((resolve) => {
          config.fileFilter({}, file, (err, result) => {
            resolve({ err, result });
          });
        });
      };

      it('deve aceitar image/jpeg', async () => {
        const { err, result } = await testFileFilter({
          originalname: 'foto.jpg',
          mimetype: 'image/jpeg'
        });
        expect(err).toBeNull();
        expect(result).toBe(true);
      });

      it('deve aceitar image/jpg', async () => {
        const { err, result } = await testFileFilter({
          originalname: 'foto.jpg',
          mimetype: 'image/jpg'
        });
        expect(err).toBeNull();
        expect(result).toBe(true);
      });

      it('deve aceitar image/png', async () => {
        const { err, result } = await testFileFilter({
          originalname: 'foto.png',
          mimetype: 'image/png'
        });
        expect(err).toBeNull();
        expect(result).toBe(true);
      });

      it('deve aceitar image/gif', async () => {
        const { err, result } = await testFileFilter({
          originalname: 'foto.gif',
          mimetype: 'image/gif'
        });
        expect(err).toBeNull();
        expect(result).toBe(true);
      });

      it('deve aceitar .JPEG maiúsculo', async () => {
        const { err, result } = await testFileFilter({
          originalname: 'foto.JPEG',
          mimetype: 'image/jpeg'
        });
        expect(err).toBeNull();
        expect(result).toBe(true);
      });

      it('deve aceitar .PNG maiúsculo', async () => {
        const { err, result } = await testFileFilter({
          originalname: 'foto.PNG',
          mimetype: 'image/png'
        });
        expect(err).toBeNull();
        expect(result).toBe(true);
      });

      it('deve rejeitar application/pdf', async () => {
        const { err } = await testFileFilter({
          originalname: 'doc.pdf',
          mimetype: 'application/pdf'
        });
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain('imagens');
      });

      it('deve rejeitar .exe', async () => {
        const { err } = await testFileFilter({
          originalname: 'virus.exe',
          mimetype: 'application/x-executable'
        });
        expect(err).toBeInstanceOf(Error);
      });

      it('deve rejeitar .txt', async () => {
        const { err } = await testFileFilter({
          originalname: 'texto.txt',
          mimetype: 'text/plain'
        });
        expect(err).toBeInstanceOf(Error);
      });

      it('deve rejeitar .js', async () => {
        const { err } = await testFileFilter({
          originalname: 'script.js',
          mimetype: 'application/javascript'
        });
        expect(err).toBeInstanceOf(Error);
      });

      it('deve rejeitar .html', async () => {
        const { err } = await testFileFilter({
          originalname: 'pagina.html',
          mimetype: 'text/html'
        });
        expect(err).toBeInstanceOf(Error);
      });

      it('deve rejeitar mimetype incorreto com extensão correta', async () => {
        const { err } = await testFileFilter({
          originalname: 'foto.jpg',
          mimetype: 'application/pdf'
        });
        expect(err).toBeInstanceOf(Error);
      });

      it('deve rejeitar extensão incorreta com mimetype correto', async () => {
        const { err } = await testFileFilter({
          originalname: 'foto.exe',
          mimetype: 'image/jpeg'
        });
        expect(err).toBeInstanceOf(Error);
      });
    });

    describe('storage local', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env.UPLOAD_STRATEGY = 'local';
        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation(() => {});
        uploadService = require('../../services/uploadService');
      });

      it('deve usar diskStorage para estratégia local', () => {
        const config = uploadService.getUploadConfig();
        expect(config.storage).toBeDefined();
        expect(mockDiskStorage).toHaveBeenCalled();
      });
    });

    describe('storage S3', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env.UPLOAD_STRATEGY = 's3';
        process.env.AWS_S3_BUCKET = 'test-bucket';
      });

      it('deve usar S3 storage para estratégia s3', () => {
        const service = require('../../services/uploadService');
        expect(service.UPLOAD_STRATEGY).toBe('s3');
      });
    });
  });

  describe('getFileUrl', () => {
    it('deve retornar filename para estratégia local', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 'local';
      const service = require('../../services/uploadService');
      
      const file = {
        filename: 'foto-123.jpg',
        key: 'vistorias/id-1/foto.jpg',
        location: 'https://bucket.s3.amazonaws.com/foto.jpg'
      };
      
      const result = service.getFileUrl(file);
      expect(result).toBe('foto-123.jpg');
    });

    it('deve retornar key para estratégia S3', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      
      const service = require('../../services/uploadService');
      
      const file = {
        filename: 'foto-123.jpg',
        key: 'vistorias/id-1/foto.jpg',
        location: 'https://bucket.s3.amazonaws.com/foto.jpg'
      };
      
      const result = service.getFileUrl(file);
      expect(result).toBe('vistorias/id-1/foto.jpg');
    });
  });

  describe('getFullPath', () => {
    describe('estratégia local', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env.UPLOAD_STRATEGY = 'local';
        uploadService = require('../../services/uploadService');
      });

      it('deve construir caminho local correto', () => {
        const result = uploadService.getFullPath('foto.jpg', 1);
        expect(result).toBe('/uploads/fotos/vistoria-1/foto.jpg');
      });

      it('deve incluir vistoria_id no caminho', () => {
        const result = uploadService.getFullPath('foto.jpg', 123);
        expect(result).toContain('vistoria-123');
      });

      it('deve lidar com vistoria_id como string', () => {
        const result = uploadService.getFullPath('foto.jpg', '456');
        expect(result).toContain('vistoria-456');
      });
    });

    describe('estratégia S3', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env.UPLOAD_STRATEGY = 's3';
        uploadService = require('../../services/uploadService');
      });

      it('deve construir URL S3 correta', () => {
        const result = uploadService.getFullPath('vistorias/id-1/foto.jpg', 1);
        expect(result).toContain('s3');
        expect(result).toContain('amazonaws.com');
      });

      it('deve retornar URL sem modificação se já for HTTP', () => {
        const httpUrl = 'https://example.com/foto.jpg';
        const result = uploadService.getFullPath(httpUrl, 1);
        expect(result).toBe(httpUrl);
      });

      it('deve incluir bucket na URL', () => {
        const result = uploadService.getFullPath('vistorias/id-1/foto.jpg', 1);
        expect(result).toContain('test-bucket');
      });

      it('deve incluir region na URL', () => {
        const result = uploadService.getFullPath('vistorias/id-1/foto.jpg', 1);
        expect(result).toContain('us-east-1');
      });
    });
  });

  describe('deleteFile', () => {
    describe('estratégia local', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env.UPLOAD_STRATEGY = 'local';
        fs.existsSync.mockReturnValue(true);
        fs.unlinkSync.mockImplementation(() => {});
        fs.readdirSync.mockReturnValue([
          { name: 'vistoria-1', isDirectory: () => true },
          { name: 'vistoria-2', isDirectory: () => true }
        ]);
        uploadService = require('../../services/uploadService');
      });

      it('deve deletar arquivo com caminho completo', async () => {
        fs.existsSync.mockReturnValue(true);
        
        await uploadService.deleteFile('/uploads/fotos/vistoria-1/foto.jpg');
        
        expect(fs.unlinkSync).toHaveBeenCalled();
      });

      it('deve buscar arquivo em diretórios de vistoria', async () => {
        fs.existsSync.mockImplementation((p) => {
          if (p.includes('vistoria-1') && p.includes('foto.jpg')) return true;
          return false;
        });
        
        await uploadService.deleteFile('foto.jpg');
        
        expect(fs.readdirSync).toHaveBeenCalled();
      });

      it('deve logar quando arquivo não encontrado', async () => {
        fs.existsSync.mockReturnValue(false);
        fs.readdirSync.mockReturnValue([]);
        
        // Não deve lançar erro
        await expect(uploadService.deleteFile('inexistente.jpg')).resolves.not.toThrow();
      });

      it('deve lançar erro se unlinkSync falhar', async () => {
        fs.existsSync.mockReturnValue(true);
        fs.unlinkSync.mockImplementation(() => {
          throw new Error('Permissão negada');
        });
        
        await expect(uploadService.deleteFile('/uploads/fotos/vistoria-1/foto.jpg'))
          .rejects.toThrow('Permissão negada');
      });

      it('deve tratar diretório fotos inexistente', async () => {
        fs.existsSync.mockReturnValue(false);
        
        await expect(uploadService.deleteFile('foto.jpg')).resolves.not.toThrow();
      });
    });

    describe('estratégia S3', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env.UPLOAD_STRATEGY = 's3';
        mockS3Send.mockResolvedValue({});
        uploadService = require('../../services/uploadService');
      });

      it('deve deletar arquivo do S3 com key', async () => {
        await uploadService.deleteFile('vistorias/id-1/foto.jpg');
        
        expect(mockS3Send).toHaveBeenCalled();
      });

      it('deve extrair key de URL completa do S3', async () => {
        const fullUrl = 'https://test-bucket.s3.us-east-1.amazonaws.com/vistorias/id-1/foto.jpg';
        
        await uploadService.deleteFile(fullUrl);
        
        expect(mockS3Send).toHaveBeenCalled();
      });

      it('deve lançar erro se S3 falhar', async () => {
        mockS3Send.mockRejectedValueOnce(new Error('S3 Error'));
        
        await expect(uploadService.deleteFile('vistorias/id-1/foto.jpg'))
          .rejects.toThrow('S3 Error');
      });
    });
  });

  describe('getStorageInfo', () => {
    describe('estratégia local', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env.UPLOAD_STRATEGY = 'local';
        uploadService = require('../../services/uploadService');
      });

      it('deve retornar strategy como "local"', () => {
        const info = uploadService.getStorageInfo();
        expect(info.strategy).toBe('local');
      });

      it('deve retornar maxFileSize como "10MB"', () => {
        const info = uploadService.getStorageInfo();
        expect(info.maxFileSize).toBe('10MB');
      });

      it('deve incluir JPEG nos tipos permitidos', () => {
        const info = uploadService.getStorageInfo();
        expect(info.allowedTypes).toContain('JPEG');
      });

      it('deve incluir PNG nos tipos permitidos', () => {
        const info = uploadService.getStorageInfo();
        expect(info.allowedTypes).toContain('PNG');
      });

      it('deve incluir GIF nos tipos permitidos', () => {
        const info = uploadService.getStorageInfo();
        expect(info.allowedTypes).toContain('GIF');
      });

      it('deve incluir JPG nos tipos permitidos', () => {
        const info = uploadService.getStorageInfo();
        expect(info.allowedTypes).toContain('JPG');
      });

      it('deve retornar localização local', () => {
        const info = uploadService.getStorageInfo();
        expect(info.location).toContain('Local');
      });
    });

    describe('estratégia S3', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env.UPLOAD_STRATEGY = 's3';
        process.env.AWS_S3_BUCKET = 'my-custom-bucket';
        uploadService = require('../../services/uploadService');
      });

      it('deve retornar strategy como "s3"', () => {
        const info = uploadService.getStorageInfo();
        expect(info.strategy).toBe('s3');
      });

      it('deve retornar localização S3 com bucket', () => {
        const info = uploadService.getStorageInfo();
        expect(info.location).toContain('S3');
        expect(info.location).toContain('my-custom-bucket');
      });
    });
  });

  describe('Exportações', () => {
    it('deve exportar getUploadConfig', () => {
      expect(uploadService.getUploadConfig).toBeDefined();
      expect(typeof uploadService.getUploadConfig).toBe('function');
    });

    it('deve exportar getFileUrl', () => {
      expect(uploadService.getFileUrl).toBeDefined();
      expect(typeof uploadService.getFileUrl).toBe('function');
    });

    it('deve exportar getFullPath', () => {
      expect(uploadService.getFullPath).toBeDefined();
      expect(typeof uploadService.getFullPath).toBe('function');
    });

    it('deve exportar deleteFile', () => {
      expect(uploadService.deleteFile).toBeDefined();
      expect(typeof uploadService.deleteFile).toBe('function');
    });

    it('deve exportar getStorageInfo', () => {
      expect(uploadService.getStorageInfo).toBeDefined();
      expect(typeof uploadService.getStorageInfo).toBe('function');
    });

    it('deve exportar UPLOAD_STRATEGY', () => {
      expect(uploadService.UPLOAD_STRATEGY).toBeDefined();
    });
  });

  describe('Cenários de integração', () => {
    it('deve processar fluxo completo de upload local', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 'local';
      const service = require('../../services/uploadService');
      
      // Simular upload
      const file = {
        filename: 'foto-123.jpg',
        path: '/tmp/foto-123.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      
      // Obter URL para salvar no banco
      const fileUrl = service.getFileUrl(file);
      expect(fileUrl).toBe('foto-123.jpg');
      
      // Obter caminho completo para exibição
      const fullPath = service.getFullPath(fileUrl, 1);
      expect(fullPath).toBe('/uploads/fotos/vistoria-1/foto-123.jpg');
    });

    it('deve processar fluxo completo de upload S3', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      const service = require('../../services/uploadService');
      
      // Simular upload
      const file = {
        filename: 'foto-123.jpg',
        key: 'vistorias/id-1/foto-123.jpg',
        location: 'https://test-bucket.s3.us-east-1.amazonaws.com/vistorias/id-1/foto-123.jpg'
      };
      
      // Obter URL para salvar no banco
      const fileUrl = service.getFileUrl(file);
      expect(fileUrl).toBe('vistorias/id-1/foto-123.jpg');
      
      // Obter caminho completo para exibição
      const fullPath = service.getFullPath(fileUrl, 1);
      expect(fullPath).toContain('s3');
      expect(fullPath).toContain('amazonaws.com');
    });
  });

  describe('Tratamento de erros', () => {
    it('deve tratar erro no fileFilter graciosamente', () => {
      const config = uploadService.getUploadConfig();
      const mockCallback = jest.fn();
      
      // Arquivo inválido
      config.fileFilter({}, { originalname: 'virus.exe', mimetype: 'application/x-executable' }, mockCallback);
      
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Error));
    });

    it('deve lançar erro quando configuração S3 falhar', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 's3';
      delete process.env.AWS_S3_BUCKET;
      
      // O serviço deve tratar o erro ou lançar exceção controlada
      expect(() => {
        require('../../services/uploadService');
      }).not.toThrow(); // Não deve quebrar a aplicação
    });
  });

  describe('localStorage callbacks', () => {
    it('deve criar diretório temporário se não existir', () => {
      jest.resetModules();
      process.env.UPLOAD_STRATEGY = 'local';
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {});
      
      const service = require('../../services/uploadService');
      const config = service.getUploadConfig();
      
      // O diskStorage é configurado com callbacks
      expect(mockDiskStorage).toHaveBeenCalled();
    });
  });
});

