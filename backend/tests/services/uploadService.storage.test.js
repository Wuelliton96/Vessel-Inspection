/**
 * Testes para cobrir localStorage callbacks e getS3Storage
 * Foco nas linhas 23-66 (localStorage) e 71-213 (getS3Storage)
 */

const path = require('path');

// Salvar env original
const originalEnv = { ...process.env };

describe('UploadService Storage Tests', () => {
  let mockFs;
  let mockMulter;
  let mockMulterS3;
  let mockAwsConfig;
  let mockImageCompress;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Configurar environment
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    process.env.UPLOAD_STRATEGY = 'local';
    process.env.AWS_S3_BUCKET = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';
    
    // Silenciar console
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });
  
  describe('localStorage callbacks', () => {
    let destinationCallback;
    let filenameCallback;
    
    beforeEach(() => {
      // Capturar os callbacks do multer.diskStorage
      mockMulter = jest.fn(() => ({
        single: jest.fn(),
        array: jest.fn()
      }));
      
      mockMulter.diskStorage = jest.fn((config) => {
        destinationCallback = config.destination;
        filenameCallback = config.filename;
        return {};
      });
      
      jest.doMock('multer', () => mockMulter);
      
      // Mock fs
      mockFs = {
        existsSync: jest.fn().mockReturnValue(false),
        mkdirSync: jest.fn(),
        unlinkSync: jest.fn(),
        readdirSync: jest.fn().mockReturnValue([])
      };
      jest.doMock('fs', () => mockFs);
      
      // Mock multer-s3
      mockMulterS3 = jest.fn(() => ({}));
      mockMulterS3.AUTO_CONTENT_TYPE = 'auto';
      jest.doMock('multer-s3', () => mockMulterS3);
      
      // Mock AWS config
      mockAwsConfig = {
        s3Client: { send: jest.fn().mockResolvedValue({}) },
        bucket: 'test-bucket',
        region: 'us-east-1'
      };
      jest.doMock('../../config/aws', () => mockAwsConfig);
      
      // Mock @aws-sdk/client-s3
      jest.doMock('@aws-sdk/client-s3', () => ({
        DeleteObjectCommand: jest.fn()
      }));
      
      // Mock imageCompress
      mockImageCompress = jest.fn(() => ({ pipe: jest.fn() }));
      jest.doMock('../../middleware/imageCompress', () => mockImageCompress);
      
      // Importar o módulo (isso vai chamar multer.diskStorage)
      process.env.UPLOAD_STRATEGY = 'local';
      require('../../services/uploadService');
    });
    
    describe('destination callback', () => {
      it('deve criar diretório temporário quando não existe', () => {
        expect(destinationCallback).toBeDefined();
        
        const req = {};
        const file = { originalname: 'test.jpg' };
        const cb = jest.fn();
        
        mockFs.existsSync.mockReturnValue(false);
        
        destinationCallback(req, file, cb);
        
        expect(mockFs.mkdirSync).toHaveBeenCalledWith(
          expect.stringContaining('temp'),
          expect.objectContaining({ recursive: true })
        );
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('temp'));
        expect(req.uploadTempDir).toBeDefined();
      });
      
      it('deve usar diretório existente sem criar', () => {
        const req = {};
        const file = { originalname: 'test.jpg' };
        const cb = jest.fn();
        
        mockFs.existsSync.mockReturnValue(true);
        
        destinationCallback(req, file, cb);
        
        expect(mockFs.mkdirSync).not.toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('temp'));
      });
    });
    
    describe('filename callback', () => {
      it('deve gerar nome com checklist_item_id quando disponível', () => {
        expect(filenameCallback).toBeDefined();
        
        const req = {
          body: { checklist_item_id: '123' },
          uploadDir: 'vistoria-1',
          uploadVistoriaId: '1'
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        filenameCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('foto-checklist-123-'));
      });
      
      it('deve gerar nome com checklistItemId (camelCase) quando disponível', () => {
        const req = {
          body: { checklistItemId: '456' },
          uploadDir: 'vistoria-1',
          uploadVistoriaId: '1'
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        filenameCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('foto-checklist-456-'));
      });
      
      it('deve gerar nome simples quando sem checklist_item_id', () => {
        const req = {
          body: {},
          uploadDir: 'vistoria-1',
          uploadVistoriaId: '1'
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        filenameCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/^foto-\d+-\d+\.jpg$/));
      });
      
      it('deve gerar nome quando req.body é undefined', () => {
        const req = {
          uploadDir: 'vistoria-1',
          uploadVistoriaId: '1'
        };
        const file = { originalname: 'photo.png' };
        const cb = jest.fn();
        
        filenameCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/^foto-\d+-\d+\.png$/));
      });
      
      it('deve ignorar checklist_item_id vazio', () => {
        const req = {
          body: { checklist_item_id: '' },
          uploadDir: 'vistoria-1',
          uploadVistoriaId: '1'
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        filenameCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.not.stringContaining('checklist'));
      });
      
      it('deve ignorar checklist_item_id undefined string', () => {
        const req = {
          body: { checklist_item_id: 'undefined' },
          uploadDir: 'vistoria-1',
          uploadVistoriaId: '1'
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        filenameCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.not.stringContaining('checklist'));
      });
      
      it('deve ignorar checklist_item_id null string', () => {
        const req = {
          body: { checklist_item_id: 'null' },
          uploadDir: 'vistoria-1',
          uploadVistoriaId: '1'
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        filenameCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.not.stringContaining('checklist'));
      });
      
      it('deve manter extensão original do arquivo', () => {
        const req = {
          body: {},
          uploadDir: 'vistoria-1',
          uploadVistoriaId: '1'
        };
        const file = { originalname: 'photo.gif' };
        const cb = jest.fn();
        
        filenameCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('.gif'));
      });
      
      it('deve usar uploadDir desconhecido quando não definido', () => {
        const req = {
          body: {},
          uploadVistoriaId: '1'
          // uploadDir não definido
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        filenameCallback(req, file, cb);
        
        // Deve completar sem erro
        expect(cb).toHaveBeenCalled();
      });
    });
  });
  
  describe('getS3Storage', () => {
    let s3KeyCallback;
    let s3MetadataCallback;
    let s3TransformKeyCallback;
    let s3TransformCallback;
    
    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      
      // Mock multer
      mockMulter = jest.fn(() => ({
        single: jest.fn(),
        array: jest.fn()
      }));
      mockMulter.diskStorage = jest.fn(() => ({}));
      jest.doMock('multer', () => mockMulter);
      
      // Mock fs
      mockFs = {
        existsSync: jest.fn().mockReturnValue(true),
        mkdirSync: jest.fn(),
        unlinkSync: jest.fn(),
        readdirSync: jest.fn().mockReturnValue([])
      };
      jest.doMock('fs', () => mockFs);
      
      // Capturar callbacks do multer-s3
      mockMulterS3 = jest.fn((config) => {
        s3KeyCallback = config.key;
        s3MetadataCallback = config.metadata;
        if (config.transforms && config.transforms[0]) {
          s3TransformKeyCallback = config.transforms[0].key;
          s3TransformCallback = config.transforms[0].transform;
        }
        return {};
      });
      mockMulterS3.AUTO_CONTENT_TYPE = 'auto';
      jest.doMock('multer-s3', () => mockMulterS3);
      
      // Mock AWS config
      mockAwsConfig = {
        s3Client: { send: jest.fn().mockResolvedValue({}) },
        bucket: 'test-bucket',
        region: 'us-east-1'
      };
      jest.doMock('../../config/aws', () => mockAwsConfig);
      
      // Mock @aws-sdk/client-s3
      jest.doMock('@aws-sdk/client-s3', () => ({
        DeleteObjectCommand: jest.fn()
      }));
      
      // Mock imageCompress
      mockImageCompress = jest.fn(() => ({ pipe: jest.fn() }));
      jest.doMock('../../middleware/imageCompress', () => mockImageCompress);
      
      // Configurar para S3
      process.env.UPLOAD_STRATEGY = 's3';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_REGION = 'us-east-1';
    });
    
    it('deve configurar S3 storage corretamente', () => {
      require('../../services/uploadService');
      
      expect(mockMulterS3).toHaveBeenCalledWith(expect.objectContaining({
        s3: expect.any(Object),
        bucket: 'test-bucket',
        contentType: 'auto',
        cacheControl: 'max-age=31536000'
      }));
    });
    
    describe('S3 key callback', () => {
      beforeEach(() => {
        require('../../services/uploadService');
      });
      
      it('deve gerar key com vistoria_id do body', () => {
        expect(s3KeyCallback).toBeDefined();
        
        const req = {
          body: { vistoria_id: '123' }
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3KeyCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('vistorias/id-123/'));
      });
      
      it('deve usar vistoriaId (camelCase) do body', () => {
        const req = {
          body: { vistoriaId: '456' }
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3KeyCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('vistorias/id-456/'));
      });
      
      it('deve usar vistoria_id da query quando body vazio', () => {
        const req = {
          body: {},
          query: { vistoria_id: '789' }
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3KeyCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('vistorias/id-789/'));
      });
      
      it('deve usar vistoria_id dos params quando query vazio', () => {
        const req = {
          body: {},
          query: {},
          params: { vistoria_id: '101' }
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3KeyCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('vistorias/id-101/'));
      });
      
      it('deve usar unknown quando vistoria_id não encontrado', () => {
        const req = {
          body: {},
          query: {},
          params: {}
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3KeyCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('vistorias/id-unknown/'));
      });
      
      it('deve ignorar vistoria_id undefined string', () => {
        const req = {
          body: { vistoria_id: 'undefined' }
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3KeyCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('vistorias/id-unknown/'));
      });
      
      it('deve ignorar vistoria_id null string', () => {
        const req = {
          body: { vistoria_id: 'null' }
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3KeyCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('vistorias/id-unknown/'));
      });
      
      it('deve incluir checklist_item_id na key quando disponível', () => {
        const req = {
          body: { 
            vistoria_id: '123',
            checklist_item_id: '456'
          }
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3KeyCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('foto-checklist-456-'));
      });
      
      it('deve ignorar checklist_item_id vazio', () => {
        const req = {
          body: { 
            vistoria_id: '123',
            checklist_item_id: ''
          }
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3KeyCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.not.stringContaining('checklist'));
      });
      
      it('deve gerar key com extensão .jpg', () => {
        const req = {
          body: { vistoria_id: '123' }
        };
        const file = { originalname: 'photo.png' };
        const cb = jest.fn();
        
        s3KeyCallback(req, file, cb);
        
        // Sempre usa .jpg pois vai comprimir
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('.jpg'));
      });
    });
    
    describe('S3 metadata callback', () => {
      beforeEach(() => {
        require('../../services/uploadService');
      });
      
      it('deve retornar metadata correta', () => {
        expect(s3MetadataCallback).toBeDefined();
        
        const req = {
          body: { vistoria_id: '123' }
        };
        const file = { 
          fieldname: 'foto',
          originalname: 'photo.jpg'
        };
        const cb = jest.fn();
        
        s3MetadataCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.objectContaining({
          fieldName: 'foto',
          vistoriaId: '123',
          originalName: 'photo.jpg',
          uploadedAt: expect.any(String)
        }));
      });
      
      it('deve usar unknown para vistoriaId quando não disponível', () => {
        const req = {
          body: {}
        };
        const file = { 
          fieldname: 'foto',
          originalname: 'photo.jpg'
        };
        const cb = jest.fn();
        
        s3MetadataCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.objectContaining({
          vistoriaId: 'unknown'
        }));
      });
    });
    
    describe('S3 transform callback', () => {
      beforeEach(() => {
        require('../../services/uploadService');
      });
      
      it('deve chamar getImageCompressTransform', () => {
        expect(s3TransformCallback).toBeDefined();
        
        const req = {};
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3TransformCallback(req, file, cb);
        
        expect(mockImageCompress).toHaveBeenCalled();
        expect(cb).toHaveBeenCalledWith(null, expect.any(Object));
      });
    });
    
    describe('S3 transform key callback', () => {
      beforeEach(() => {
        require('../../services/uploadService');
      });
      
      it('deve gerar key similar à key principal', () => {
        expect(s3TransformKeyCallback).toBeDefined();
        
        const req = {
          body: { 
            vistoria_id: '123',
            checklist_item_id: '456'
          }
        };
        const file = { originalname: 'photo.jpg' };
        const cb = jest.fn();
        
        s3TransformKeyCallback(req, file, cb);
        
        expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('vistorias/id-123/foto-checklist-456-'));
      });
    });
    
    describe('S3 config error', () => {
      it('deve lançar erro quando bucket não configurado', () => {
        jest.resetModules();
        
        // Mock com bucket undefined
        jest.doMock('../../config/aws', () => ({
          s3Client: { send: jest.fn() },
          bucket: undefined,
          region: 'us-east-1'
        }));
        
        // Mock multer
        jest.doMock('multer', () => {
          const m = jest.fn(() => ({ single: jest.fn(), array: jest.fn() }));
          m.diskStorage = jest.fn(() => ({}));
          return m;
        });
        
        // Mock fs
        jest.doMock('fs', () => ({
          existsSync: jest.fn().mockReturnValue(true),
          mkdirSync: jest.fn(),
          unlinkSync: jest.fn(),
          readdirSync: jest.fn().mockReturnValue([])
        }));
        
        // Mock multer-s3 para lançar erro
        jest.doMock('multer-s3', () => {
          const mock = jest.fn(() => ({}));
          mock.AUTO_CONTENT_TYPE = 'auto';
          return mock;
        });
        
        jest.doMock('../../middleware/imageCompress', () => jest.fn(() => ({ pipe: jest.fn() })));
        
        process.env.UPLOAD_STRATEGY = 's3';
        process.env.AWS_S3_BUCKET = '';
        
        expect(() => {
          require('../../services/uploadService');
        }).toThrow();
      });
    });
  });
});



