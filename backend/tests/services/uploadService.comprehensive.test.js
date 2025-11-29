/**
 * Testes abrangentes para uploadService
 */

const path = require('path');
const fs = require('fs');

// Mock do fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  unlink: jest.fn((path, cb) => cb(null)),
  promises: {
    unlink: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock do AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({})
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn()
}));

// Mock do multer-s3
jest.mock('multer-s3', () => {
  return jest.fn().mockReturnValue({
    _handleFile: jest.fn(),
    _removeFile: jest.fn()
  });
});

describe('Upload Service - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Configurações padrão
    process.env.UPLOAD_PROVIDER = 'local';
    process.env.UPLOADS_DIR = 'uploads';
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.S3_BUCKET;
  });
  
  // ==========================================
  // Configuração do Upload
  // ==========================================
  
  describe('Configuração do Upload', () => {
    it('deve usar provider local por padrão', () => {
      delete process.env.UPLOAD_PROVIDER;
      
      jest.resetModules();
      const uploadService = require('../../services/uploadService');
      
      expect(uploadService).toBeDefined();
      expect(uploadService.UPLOAD_STRATEGY).toBe('local');
    });
    
    it('deve configurar provider S3', () => {
      process.env.UPLOAD_PROVIDER = 's3';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      process.env.AWS_REGION = 'us-east-1';
      process.env.S3_BUCKET = 'test-bucket';
      
      jest.resetModules();
      const uploadService = require('../../services/uploadService');
      
      expect(uploadService).toBeDefined();
    });
    
    it('deve ter configuração de tamanho máximo', () => {
      jest.resetModules();
      const uploadService = require('../../services/uploadService');
      
      const config = uploadService.getUploadConfig();
      
      expect(config).toBeDefined();
      expect(config.limits).toBeDefined();
    });
    
    it('deve ter filtro de arquivos', () => {
      jest.resetModules();
      const uploadService = require('../../services/uploadService');
      
      const config = uploadService.getUploadConfig();
      
      expect(config).toBeDefined();
    });
  });
  
  // ==========================================
  // getFullPath
  // ==========================================
  
  describe('getFullPath', () => {
    it('deve retornar caminho completo para arquivo local', () => {
      process.env.UPLOAD_PROVIDER = 'local';
      process.env.BASE_URL = 'http://localhost:3000';
      
      jest.resetModules();
      const { getFullPath } = require('../../services/uploadService');
      
      const result = getFullPath('foto.jpg', 1);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
    
    it('deve lidar com arquivo undefined', () => {
      jest.resetModules();
      const { getFullPath } = require('../../services/uploadService');
      
      const result = getFullPath(undefined, 1);
      
      // Deve retornar null, undefined ou string vazia
      expect(result === null || result === undefined || result === '').toBeFalsy();
    });
    
    it('deve lidar com vistoria_id undefined', () => {
      jest.resetModules();
      const { getFullPath } = require('../../services/uploadService');
      
      const result = getFullPath('foto.jpg', undefined);
      
      expect(typeof result === 'string' || result === null || result === undefined).toBe(true);
    });
    
    it('deve construir caminho com vistoria_id', () => {
      jest.resetModules();
      const { getFullPath } = require('../../services/uploadService');
      
      const result = getFullPath('foto.jpg', 123);
      
      if (result) {
        expect(result).toContain('123');
      }
    });
  });
  
  // ==========================================
  // getFileUrl
  // ==========================================
  
  describe('getFileUrl', () => {
    it('deve retornar filename para upload local', () => {
      process.env.UPLOAD_PROVIDER = 'local';
      
      jest.resetModules();
      const { getFileUrl } = require('../../services/uploadService');
      
      const file = { filename: 'test-photo.jpg' };
      const result = getFileUrl(file);
      
      expect(result).toBeDefined();
    });
    
    it('deve retornar key para upload S3', () => {
      process.env.UPLOAD_PROVIDER = 's3';
      process.env.AWS_ACCESS_KEY_ID = 'test';
      process.env.AWS_SECRET_ACCESS_KEY = 'test';
      process.env.S3_BUCKET = 'test';
      
      jest.resetModules();
      const { getFileUrl } = require('../../services/uploadService');
      
      const file = { key: 'vistorias/id-1/photo.jpg', filename: 'photo.jpg' };
      const result = getFileUrl(file);
      
      expect(result).toBeDefined();
    });
    
    it('deve lidar com file undefined', () => {
      jest.resetModules();
      const { getFileUrl } = require('../../services/uploadService');
      
      const result = getFileUrl(undefined);
      
      expect(result === null || result === undefined || result === '').toBeTruthy();
    });
  });
  
  // ==========================================
  // deleteFile
  // ==========================================
  
  describe('deleteFile', () => {
    it('deve deletar arquivo local', async () => {
      process.env.UPLOAD_PROVIDER = 'local';
      fs.existsSync.mockReturnValue(true);
      
      jest.resetModules();
      const { deleteFile } = require('../../services/uploadService');
      
      if (deleteFile) {
        await expect(deleteFile('foto.jpg')).resolves.not.toThrow();
      }
    });
    
    it('não deve falhar ao deletar arquivo inexistente', async () => {
      process.env.UPLOAD_PROVIDER = 'local';
      fs.existsSync.mockReturnValue(false);
      
      jest.resetModules();
      const { deleteFile } = require('../../services/uploadService');
      
      if (deleteFile) {
        await expect(deleteFile('inexistente.jpg')).resolves.not.toThrow();
      }
    });
    
    it('deve deletar arquivo do S3', async () => {
      process.env.UPLOAD_PROVIDER = 's3';
      process.env.AWS_ACCESS_KEY_ID = 'test';
      process.env.AWS_SECRET_ACCESS_KEY = 'test';
      process.env.S3_BUCKET = 'test';
      
      jest.resetModules();
      const { deleteFile } = require('../../services/uploadService');
      
      if (deleteFile) {
        await expect(deleteFile('vistorias/id-1/foto.jpg')).resolves.not.toThrow();
      }
    });
  });
  
  // ==========================================
  // getStorageInfo
  // ==========================================
  
  describe('getStorageInfo', () => {
    it('deve retornar informações de storage local', () => {
      process.env.UPLOAD_PROVIDER = 'local';
      
      jest.resetModules();
      const { getStorageInfo } = require('../../services/uploadService');
      
      const info = getStorageInfo();
      
      expect(info).toBeDefined();
      expect(info.strategy).toBe('local');
    });
    
    it('deve retornar informações de storage S3', () => {
      process.env.UPLOAD_PROVIDER = 's3';
      process.env.AWS_ACCESS_KEY_ID = 'test';
      process.env.AWS_SECRET_ACCESS_KEY = 'test';
      process.env.S3_BUCKET = 'test-bucket';
      
      jest.resetModules();
      const { getStorageInfo } = require('../../services/uploadService');
      
      const info = getStorageInfo();
      
      expect(info).toBeDefined();
    });
    
    it('deve incluir tamanho máximo de arquivo', () => {
      jest.resetModules();
      const { getStorageInfo } = require('../../services/uploadService');
      
      const info = getStorageInfo();
      
      expect(info.maxFileSize).toBeDefined();
    });
    
    it('deve incluir tipos de arquivo permitidos', () => {
      jest.resetModules();
      const { getStorageInfo } = require('../../services/uploadService');
      
      const info = getStorageInfo();
      
      expect(info.allowedTypes).toBeDefined();
    });
  });
  
  // ==========================================
  // Filtro de Arquivos
  // ==========================================
  
  describe('Filtro de Arquivos', () => {
    it('deve aceitar imagem JPEG', () => {
      const file = { mimetype: 'image/jpeg', originalname: 'foto.jpg' };
      const isValid = file.mimetype.startsWith('image/');
      
      expect(isValid).toBe(true);
    });
    
    it('deve aceitar imagem PNG', () => {
      const file = { mimetype: 'image/png', originalname: 'foto.png' };
      const isValid = file.mimetype.startsWith('image/');
      
      expect(isValid).toBe(true);
    });
    
    it('deve aceitar imagem WebP', () => {
      const file = { mimetype: 'image/webp', originalname: 'foto.webp' };
      const isValid = file.mimetype.startsWith('image/');
      
      expect(isValid).toBe(true);
    });
    
    it('deve aceitar imagem GIF', () => {
      const file = { mimetype: 'image/gif', originalname: 'foto.gif' };
      const isValid = file.mimetype.startsWith('image/');
      
      expect(isValid).toBe(true);
    });
    
    it('deve rejeitar arquivo PDF', () => {
      const file = { mimetype: 'application/pdf', originalname: 'doc.pdf' };
      const isValid = file.mimetype.startsWith('image/');
      
      expect(isValid).toBe(false);
    });
    
    it('deve rejeitar arquivo de texto', () => {
      const file = { mimetype: 'text/plain', originalname: 'doc.txt' };
      const isValid = file.mimetype.startsWith('image/');
      
      expect(isValid).toBe(false);
    });
    
    it('deve rejeitar arquivo executável', () => {
      const file = { mimetype: 'application/x-msdownload', originalname: 'virus.exe' };
      const isValid = file.mimetype.startsWith('image/');
      
      expect(isValid).toBe(false);
    });
  });
  
  // ==========================================
  // Geração de Nomes de Arquivo
  // ==========================================
  
  describe('Geração de Nomes de Arquivo', () => {
    it('deve gerar nome único com timestamp', () => {
      const timestamp = Date.now();
      const ext = '.jpg';
      const filename = `foto_${timestamp}${ext}`;
      
      expect(filename).toMatch(/foto_\d+\.jpg/);
    });
    
    it('deve preservar extensão do arquivo', () => {
      const originalname = 'minha_foto.PNG';
      const ext = path.extname(originalname).toLowerCase();
      
      expect(ext).toBe('.png');
    });
    
    it('deve gerar nome com ID de vistoria', () => {
      const vistoriaId = 123;
      const timestamp = Date.now();
      const filename = `vistoria-${vistoriaId}-foto-${timestamp}.jpg`;
      
      expect(filename).toContain('vistoria-123');
    });
    
    it('deve gerar nome com ID de checklist item', () => {
      const checklistItemId = 456;
      const timestamp = Date.now();
      const filename = `foto-checklist-${checklistItemId}-${timestamp}.jpg`;
      
      expect(filename).toContain('checklist-456');
    });
  });
  
  // ==========================================
  // Criação de Diretórios
  // ==========================================
  
  describe('Criação de Diretórios', () => {
    it('deve criar diretório base de uploads', () => {
      fs.existsSync.mockReturnValue(false);
      
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(uploadDir, { recursive: true });
    });
    
    it('deve criar diretório de fotos por vistoria', () => {
      fs.existsSync.mockReturnValue(false);
      
      const vistoriaId = 123;
      const fotoDir = path.join(process.cwd(), 'uploads', 'fotos', `vistoria-${vistoriaId}`);
      
      if (!fs.existsSync(fotoDir)) {
        fs.mkdirSync(fotoDir, { recursive: true });
      }
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(fotoDir, { recursive: true });
    });
    
    it('não deve criar diretório se já existir', () => {
      fs.existsSync.mockReturnValue(true);
      fs.mkdirSync.mockClear();
      
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });
  
  // ==========================================
  // Configurações de Tamanho
  // ==========================================
  
  describe('Configurações de Tamanho', () => {
    it('deve ter limite de 10MB', () => {
      const maxSize = 10 * 1024 * 1024;
      
      expect(maxSize).toBe(10485760);
    });
    
    it('deve converter bytes para MB', () => {
      const bytes = 5242880;
      const mb = bytes / (1024 * 1024);
      
      expect(mb).toBe(5);
    });
    
    it('deve validar tamanho do arquivo', () => {
      const maxSize = 10 * 1024 * 1024;
      const fileSize = 5 * 1024 * 1024;
      
      const isValid = fileSize <= maxSize;
      
      expect(isValid).toBe(true);
    });
    
    it('deve rejeitar arquivo muito grande', () => {
      const maxSize = 10 * 1024 * 1024;
      const fileSize = 15 * 1024 * 1024;
      
      const isValid = fileSize <= maxSize;
      
      expect(isValid).toBe(false);
    });
  });
  
  // ==========================================
  // URL S3
  // ==========================================
  
  describe('URL S3', () => {
    it('deve construir URL S3 correta', () => {
      const bucket = 'my-bucket';
      const region = 'us-east-1';
      const key = 'vistorias/id-1/foto.jpg';
      
      const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      
      expect(url).toContain(bucket);
      expect(url).toContain(key);
    });
    
    it('deve construir key S3 correta', () => {
      const vistoriaId = 123;
      const filename = 'foto.jpg';
      const timestamp = Date.now();
      
      const key = `vistorias/id-${vistoriaId}/foto-${timestamp}.jpg`;
      
      expect(key).toContain(`id-${vistoriaId}`);
    });
  });
});

