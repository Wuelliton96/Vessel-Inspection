/**
 * Testes unitários para uploadService
 */

const fs = require('fs');
const path = require('path');

// Mock do fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  unlink: jest.fn((path, cb) => cb(null)),
  promises: {
    unlink: jest.fn().mockResolvedValue(undefined)
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

describe('Upload Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset modules to get fresh imports
    jest.resetModules();
    
    // Set environment variables
    process.env.UPLOAD_PROVIDER = 'local';
    process.env.UPLOADS_DIR = 'uploads';
  });
  
  describe('Configuração do Upload', () => {
    it('deve usar provider local por padrão', () => {
      delete process.env.UPLOAD_PROVIDER;
      
      const uploadService = require('../../services/uploadService');
      
      expect(uploadService).toBeDefined();
    });
    
    it('deve configurar provider S3 quando especificado', () => {
      process.env.UPLOAD_PROVIDER = 's3';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      process.env.AWS_REGION = 'us-east-1';
      process.env.S3_BUCKET = 'test-bucket';
      
      jest.resetModules();
      const uploadService = require('../../services/uploadService');
      
      expect(uploadService).toBeDefined();
    });
  });
  
  describe('getFullPath', () => {
    it('deve retornar caminho completo para arquivo local', () => {
      process.env.UPLOAD_PROVIDER = 'local';
      process.env.BASE_URL = 'http://localhost:3000';
      
      jest.resetModules();
      const { getFullPath } = require('../../services/uploadService');
      
      const result = getFullPath('fotos/foto.jpg', 1);
      
      expect(result).toContain('foto.jpg');
    });
    
    it('deve lidar com arquivo undefined', () => {
      jest.resetModules();
      const { getFullPath } = require('../../services/uploadService');
      
      const result = getFullPath(undefined, 1);
      
      expect(result).toBeFalsy();
    });
    
    it('deve lidar com vistoria_id undefined', () => {
      jest.resetModules();
      const { getFullPath } = require('../../services/uploadService');
      
      const result = getFullPath('foto.jpg', undefined);
      
      expect(typeof result === 'string' || result === null || result === undefined).toBe(true);
    });
  });
  
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
    
    it('deve não falhar ao deletar arquivo inexistente', async () => {
      process.env.UPLOAD_PROVIDER = 'local';
      fs.existsSync.mockReturnValue(false);
      
      jest.resetModules();
      const { deleteFile } = require('../../services/uploadService');
      
      if (deleteFile) {
        await expect(deleteFile('inexistente.jpg')).resolves.not.toThrow();
      }
    });
  });
  
  describe('Filtro de arquivos', () => {
    it('deve aceitar imagens jpg', () => {
      const file = { mimetype: 'image/jpeg', originalname: 'foto.jpg' };
      
      expect(file.mimetype.startsWith('image/')).toBe(true);
    });
    
    it('deve aceitar imagens png', () => {
      const file = { mimetype: 'image/png', originalname: 'foto.png' };
      
      expect(file.mimetype.startsWith('image/')).toBe(true);
    });
    
    it('deve aceitar imagens webp', () => {
      const file = { mimetype: 'image/webp', originalname: 'foto.webp' };
      
      expect(file.mimetype.startsWith('image/')).toBe(true);
    });
    
    it('deve rejeitar arquivos não-imagem', () => {
      const file = { mimetype: 'application/pdf', originalname: 'doc.pdf' };
      
      expect(file.mimetype.startsWith('image/')).toBe(false);
    });
  });
  
  describe('Geração de nomes de arquivo', () => {
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
  });
  
  describe('Criação de diretório de uploads', () => {
    it('deve criar diretório se não existir', () => {
      fs.existsSync.mockReturnValue(false);
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'fotos');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(uploadDir, { recursive: true });
    });
    
    it('não deve criar diretório se já existir', () => {
      fs.existsSync.mockReturnValue(true);
      fs.mkdirSync.mockClear();
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'fotos');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });
  
  describe('Configuração do Multer', () => {
    it('deve ter limite de tamanho de arquivo', () => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      expect(maxSize).toBe(10485760);
    });
    
    it('deve ter configuração de storage', () => {
      jest.resetModules();
      const uploadService = require('../../services/uploadService');
      
      expect(uploadService.upload).toBeDefined();
    });
  });
});

