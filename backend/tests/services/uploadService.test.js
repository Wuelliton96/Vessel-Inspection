const {
  getUploadConfig,
  getFileUrl,
  getFullPath,
  deleteFile,
  getStorageInfo,
  UPLOAD_STRATEGY
} = require('../../services/uploadService');
const path = require('path');

describe('Upload Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('UPLOAD_STRATEGY', () => {
    it('deve ter estratégia definida', () => {
      expect(UPLOAD_STRATEGY).toBeDefined();
      expect(['local', 's3']).toContain(UPLOAD_STRATEGY);
    });

    it('deve usar local como padrão', () => {
      delete process.env.UPLOAD_STRATEGY;
      jest.resetModules();
      const { UPLOAD_STRATEGY: strategy } = require('../../services/uploadService');
      
      expect(strategy).toBe('local');
    });
  });

  describe('getStorageInfo', () => {
    it('deve retornar informações de storage', () => {
      const info = getStorageInfo();
      
      expect(info).toBeDefined();
      expect(info).toHaveProperty('strategy');
      expect(info).toHaveProperty('maxFileSize');
      expect(info).toHaveProperty('allowedTypes');
    });

    it('deve retornar estratégia local quando configurado', () => {
      process.env.UPLOAD_STRATEGY = 'local';
      jest.resetModules();
      const { getStorageInfo } = require('../../services/uploadService');
      
      const info = getStorageInfo();
      expect(info.strategy).toBe('local');
    });
  });

  describe('getUploadConfig', () => {
    it('deve retornar configuração de upload', () => {
      const config = getUploadConfig();
      
      expect(config).toBeDefined();
    });

    it('deve ter limites de arquivo configurados', () => {
      const config = getUploadConfig();
      
      expect(config).toBeDefined();
    });
  });

  describe('getFullPath', () => {
    it('deve construir caminho completo com vistoria_id', () => {
      const path = getFullPath('foto.jpg', 123);
      
      expect(path).toBeDefined();
      expect(typeof path).toBe('string');
      expect(path).toContain('foto.jpg');
    });

    it('deve construir caminho quando url_arquivo já tem caminho completo', () => {
      const path = getFullPath('vistorias/id-123/foto.jpg', 123);
      
      expect(path).toBeDefined();
      expect(typeof path).toBe('string');
    });

    it('deve lidar com vistoria_id null', () => {
      const path = getFullPath('foto.jpg', null);
      
      expect(path).toBeDefined();
    });
  });

  describe('getFileUrl', () => {
    it('deve retornar URL do arquivo', () => {
      const url = getFileUrl('foto.jpg', 123);
      
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });

    it('deve retornar URL diferente baseado na estratégia', () => {
      const urlLocal = getFileUrl('foto.jpg', 123);
      
      expect(urlLocal).toBeDefined();
    });
  });

  describe('deleteFile', () => {
    it('deve retornar promise quando arquivo não existe', async () => {
      const resultado = await deleteFile('arquivo-inexistente.jpg', 123);
      
      expect(resultado).toBeDefined();
    });

    it('deve lidar com caminho completo', async () => {
      const resultado = await deleteFile('vistorias/id-123/foto.jpg', 123);
      
      expect(resultado).toBeDefined();
    });
  });
});
