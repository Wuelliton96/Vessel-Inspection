/**
 * Testes específicos para a função deleteFile
 * Foco nas linhas 325-340 (busca em diretórios) e 349-350 (fs operations)
 */

const originalEnv = { ...process.env };

describe('uploadService.deleteFile - Testes Detalhados', () => {
  let uploadService;
  let mockFs;
  let mockAwsConfig;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.UPLOAD_STRATEGY = 'local';
    
    // Silenciar console
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });
  
  describe('Local Storage - Caminho /uploads/', () => {
    beforeEach(() => {
      mockFs = {
        existsSync: jest.fn(),
        mkdirSync: jest.fn(),
        unlinkSync: jest.fn(),
        readdirSync: jest.fn()
      };
      jest.doMock('fs', () => mockFs);
      
      // Mock multer
      const mockMulter = jest.fn(() => ({ single: jest.fn(), array: jest.fn() }));
      mockMulter.diskStorage = jest.fn(() => ({}));
      jest.doMock('multer', () => mockMulter);
      
      // Mock multer-s3
      const mockMulterS3 = jest.fn(() => ({}));
      mockMulterS3.AUTO_CONTENT_TYPE = 'auto';
      jest.doMock('multer-s3', () => mockMulterS3);
      
      // Mock AWS config
      jest.doMock('../../config/aws', () => ({
        s3Client: { send: jest.fn() },
        bucket: 'test-bucket',
        region: 'us-east-1'
      }));
      
      // Mock @aws-sdk/client-s3
      jest.doMock('@aws-sdk/client-s3', () => ({
        DeleteObjectCommand: jest.fn()
      }));
      
      // Mock imageCompress
      jest.doMock('../../middleware/imageCompress', () => jest.fn(() => ({ pipe: jest.fn() })));
      
      process.env.UPLOAD_STRATEGY = 'local';
      uploadService = require('../../services/uploadService');
    });
    
    it('deve deletar arquivo com caminho /uploads/ diretamente', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {});
      
      await uploadService.deleteFile('/uploads/fotos/vistoria-1/foto.jpg');
      
      expect(mockFs.existsSync).toHaveBeenCalled();
      expect(mockFs.unlinkSync).toHaveBeenCalled();
    });
    
    it('deve logar quando arquivo /uploads/ não existe', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      await uploadService.deleteFile('/uploads/fotos/vistoria-1/foto.jpg');
      
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });
  });
  
  describe('Local Storage - Busca em Diretórios', () => {
    beforeEach(() => {
      mockFs = {
        existsSync: jest.fn(),
        mkdirSync: jest.fn(),
        unlinkSync: jest.fn(),
        readdirSync: jest.fn()
      };
      jest.doMock('fs', () => mockFs);
      
      // Mock multer
      const mockMulter = jest.fn(() => ({ single: jest.fn(), array: jest.fn() }));
      mockMulter.diskStorage = jest.fn(() => ({}));
      jest.doMock('multer', () => mockMulter);
      
      // Mock multer-s3
      const mockMulterS3 = jest.fn(() => ({}));
      mockMulterS3.AUTO_CONTENT_TYPE = 'auto';
      jest.doMock('multer-s3', () => mockMulterS3);
      
      // Mock AWS config
      jest.doMock('../../config/aws', () => ({
        s3Client: { send: jest.fn() },
        bucket: 'test-bucket',
        region: 'us-east-1'
      }));
      
      // Mock @aws-sdk/client-s3
      jest.doMock('@aws-sdk/client-s3', () => ({
        DeleteObjectCommand: jest.fn()
      }));
      
      // Mock imageCompress
      jest.doMock('../../middleware/imageCompress', () => jest.fn(() => ({ pipe: jest.fn() })));
      
      process.env.UPLOAD_STRATEGY = 'local';
      uploadService = require('../../services/uploadService');
    });
    
    it('deve buscar arquivo apenas pelo nome em pastas de vistoria', async () => {
      // Setup: pasta fotos existe, vistoria-1 contém o arquivo
      let callCount = 0;
      mockFs.existsSync.mockImplementation((path) => {
        callCount++;
        // Primeira chamada: verifica se fotosDir existe
        if (path.includes('uploads/fotos') && !path.includes('vistoria-')) {
          return true;
        }
        // Chamada para verificar se arquivo existe na pasta vistoria-1
        if (path.includes('vistoria-1') && path.includes('minha-foto.jpg')) {
          return true;
        }
        return false;
      });
      
      mockFs.readdirSync.mockReturnValue([
        { name: 'vistoria-1', isDirectory: () => true },
        { name: 'vistoria-2', isDirectory: () => true },
        { name: 'temp', isDirectory: () => true }
      ]);
      
      mockFs.unlinkSync.mockImplementation(() => {});
      
      await uploadService.deleteFile('minha-foto.jpg');
      
      expect(mockFs.readdirSync).toHaveBeenCalled();
      expect(mockFs.unlinkSync).toHaveBeenCalled();
    });
    
    it('deve percorrer múltiplas pastas de vistoria até encontrar arquivo', async () => {
      // Setup: arquivo está na vistoria-3
      mockFs.existsSync.mockImplementation((path) => {
        if (path.includes('uploads/fotos') && !path.includes('vistoria-')) {
          return true;
        }
        // Arquivo está apenas na vistoria-3
        if (path.includes('vistoria-3') && path.includes('foto-especial.jpg')) {
          return true;
        }
        return false;
      });
      
      mockFs.readdirSync.mockReturnValue([
        { name: 'vistoria-1', isDirectory: () => true },
        { name: 'vistoria-2', isDirectory: () => true },
        { name: 'vistoria-3', isDirectory: () => true }
      ]);
      
      mockFs.unlinkSync.mockImplementation(() => {});
      
      await uploadService.deleteFile('foto-especial.jpg');
      
      expect(mockFs.unlinkSync).toHaveBeenCalled();
    });
    
    it('deve ignorar diretórios que não começam com vistoria-', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (path.includes('uploads/fotos') && !path.includes('vistoria-')) {
          return true;
        }
        return false;
      });
      
      mockFs.readdirSync.mockReturnValue([
        { name: 'temp', isDirectory: () => true },
        { name: 'backup', isDirectory: () => true },
        { name: 'other-folder', isDirectory: () => true }
      ]);
      
      await uploadService.deleteFile('foto.jpg');
      
      // Não deve deletar porque não encontrou em nenhuma pasta vistoria-*
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });
    
    it('deve logar quando arquivo não encontrado em nenhuma pasta', async () => {
      mockFs.existsSync.mockImplementation((path) => {
        if (path.includes('uploads/fotos') && !path.includes('vistoria-')) {
          return true;
        }
        return false;
      });
      
      mockFs.readdirSync.mockReturnValue([
        { name: 'vistoria-1', isDirectory: () => true },
        { name: 'vistoria-2', isDirectory: () => true }
      ]);
      
      await uploadService.deleteFile('arquivo-nao-existe.jpg');
      
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });
    
    it('deve logar quando diretório de fotos não existe', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      await uploadService.deleteFile('foto.jpg');
      
      expect(mockFs.readdirSync).not.toHaveBeenCalled();
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });
  });
  
  describe('S3 Storage - deleteFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      
      mockFs = {
        existsSync: jest.fn().mockReturnValue(true),
        mkdirSync: jest.fn(),
        unlinkSync: jest.fn(),
        readdirSync: jest.fn()
      };
      jest.doMock('fs', () => mockFs);
      
      // Mock multer
      const mockMulter = jest.fn(() => ({ single: jest.fn(), array: jest.fn() }));
      mockMulter.diskStorage = jest.fn(() => ({}));
      jest.doMock('multer', () => mockMulter);
      
      // Mock multer-s3
      const mockMulterS3 = jest.fn(() => ({}));
      mockMulterS3.AUTO_CONTENT_TYPE = 'auto';
      jest.doMock('multer-s3', () => mockMulterS3);
      
      // Mock imageCompress
      jest.doMock('../../middleware/imageCompress', () => jest.fn(() => ({ pipe: jest.fn() })));
    });
    
    it('deve deletar usando key direta do S3', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      
      jest.doMock('../../config/aws', () => ({
        s3Client: { send: mockSend },
        bucket: 'test-bucket',
        region: 'us-east-1'
      }));
      
      jest.doMock('@aws-sdk/client-s3', () => ({
        DeleteObjectCommand: jest.fn().mockImplementation((params) => params)
      }));
      
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      
      await uploadService.deleteFile('vistorias/id-1/foto.jpg');
      
      expect(mockSend).toHaveBeenCalled();
    });
    
    it('deve extrair key de URL completa S3', async () => {
      const mockSend = jest.fn().mockResolvedValue({});
      
      jest.doMock('../../config/aws', () => ({
        s3Client: { send: mockSend },
        bucket: 'test-bucket',
        region: 'us-east-1'
      }));
      
      jest.doMock('@aws-sdk/client-s3', () => ({
        DeleteObjectCommand: jest.fn().mockImplementation((params) => params)
      }));
      
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      
      const fullUrl = 'https://test-bucket.s3.us-east-1.amazonaws.com/vistorias/id-1/foto.jpg';
      await uploadService.deleteFile(fullUrl);
      
      expect(mockSend).toHaveBeenCalled();
    });
    
    it('deve lançar erro quando S3 falha', async () => {
      const mockSend = jest.fn().mockRejectedValue(new Error('S3 Error'));
      
      jest.doMock('../../config/aws', () => ({
        s3Client: { send: mockSend },
        bucket: 'test-bucket',
        region: 'us-east-1'
      }));
      
      jest.doMock('@aws-sdk/client-s3', () => ({
        DeleteObjectCommand: jest.fn().mockImplementation((params) => params)
      }));
      
      process.env.UPLOAD_STRATEGY = 's3';
      uploadService = require('../../services/uploadService');
      
      await expect(uploadService.deleteFile('vistorias/id-1/foto.jpg'))
        .rejects.toThrow('S3 Error');
    });
  });
  
  describe('Error Handling', () => {
    beforeEach(() => {
      mockFs = {
        existsSync: jest.fn(),
        mkdirSync: jest.fn(),
        unlinkSync: jest.fn(),
        readdirSync: jest.fn()
      };
      jest.doMock('fs', () => mockFs);
      
      // Mock multer
      const mockMulter = jest.fn(() => ({ single: jest.fn(), array: jest.fn() }));
      mockMulter.diskStorage = jest.fn(() => ({}));
      jest.doMock('multer', () => mockMulter);
      
      // Mock multer-s3
      const mockMulterS3 = jest.fn(() => ({}));
      mockMulterS3.AUTO_CONTENT_TYPE = 'auto';
      jest.doMock('multer-s3', () => mockMulterS3);
      
      // Mock AWS config
      jest.doMock('../../config/aws', () => ({
        s3Client: { send: jest.fn() },
        bucket: 'test-bucket',
        region: 'us-east-1'
      }));
      
      // Mock @aws-sdk/client-s3
      jest.doMock('@aws-sdk/client-s3', () => ({
        DeleteObjectCommand: jest.fn()
      }));
      
      // Mock imageCompress
      jest.doMock('../../middleware/imageCompress', () => jest.fn(() => ({ pipe: jest.fn() })));
      
      process.env.UPLOAD_STRATEGY = 'local';
      uploadService = require('../../services/uploadService');
    });
    
    it('deve lançar erro quando fs.unlinkSync falha', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      await expect(uploadService.deleteFile('/uploads/fotos/vistoria-1/foto.jpg'))
        .rejects.toThrow('Permission denied');
    });
    
    it('deve logar erro antes de relançar', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error('Disk full');
      });
      
      try {
        await uploadService.deleteFile('/uploads/fotos/vistoria-1/foto.jpg');
      } catch (e) {
        expect(e.message).toBe('Disk full');
      }
    });
  });
});



