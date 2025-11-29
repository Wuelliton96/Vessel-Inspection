/**
 * Testes para imageCache.ts
 */

import { imageCacheManager } from '../imageCache';

describe('ImageCacheManager', () => {
  beforeEach(() => {
    // Limpar cache antes de cada teste
    imageCacheManager.clearCache();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('addToCache', () => {
    it('deve adicionar imagem ao cache', () => {
      const mockImg = new Image();
      mockImg.src = 'test.jpg';
      
      imageCacheManager.addToCache('http://example.com/test.jpg', mockImg);
      
      expect(imageCacheManager.getCacheSize()).toBe(1);
    });

    it('deve remover a mais antiga quando cache está cheio', () => {
      // Adicionar 50 imagens (limite do cache)
      for (let i = 0; i < 50; i++) {
        const mockImg = new Image();
        mockImg.src = `test${i}.jpg`;
        imageCacheManager.addToCache(`http://example.com/test${i}.jpg`, mockImg);
      }
      
      expect(imageCacheManager.getCacheSize()).toBe(50);
      
      // Adicionar mais uma (deve remover a primeira)
      const newImg = new Image();
      newImg.src = 'new.jpg';
      imageCacheManager.addToCache('http://example.com/new.jpg', newImg);
      
      expect(imageCacheManager.getCacheSize()).toBe(50);
      expect(imageCacheManager.getFromCache('http://example.com/test0.jpg')).toBeNull();
      expect(imageCacheManager.getFromCache('http://example.com/new.jpg')).toBe(newImg);
    });

    it('deve atualizar imagem se URL já existe', () => {
      const mockImg1 = new Image();
      mockImg1.src = 'test1.jpg';
      
      const mockImg2 = new Image();
      mockImg2.src = 'test2.jpg';
      
      imageCacheManager.addToCache('http://example.com/test.jpg', mockImg1);
      imageCacheManager.addToCache('http://example.com/test.jpg', mockImg2);
      
      expect(imageCacheManager.getCacheSize()).toBe(1);
      expect(imageCacheManager.getFromCache('http://example.com/test.jpg')).toBe(mockImg2);
    });
  });

  describe('getFromCache', () => {
    it('deve retornar imagem do cache', () => {
      const mockImg = new Image();
      mockImg.src = 'test.jpg';
      
      imageCacheManager.addToCache('http://example.com/test.jpg', mockImg);
      
      const result = imageCacheManager.getFromCache('http://example.com/test.jpg');
      expect(result).toBe(mockImg);
    });

    it('deve retornar null se URL não está no cache', () => {
      const result = imageCacheManager.getFromCache('http://example.com/notfound.jpg');
      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('deve limpar todo o cache', () => {
      const mockImg1 = new Image();
      const mockImg2 = new Image();
      
      imageCacheManager.addToCache('http://example.com/test1.jpg', mockImg1);
      imageCacheManager.addToCache('http://example.com/test2.jpg', mockImg2);
      
      expect(imageCacheManager.getCacheSize()).toBe(2);
      
      imageCacheManager.clearCache();
      
      expect(imageCacheManager.getCacheSize()).toBe(0);
    });

    it('deve limpar referências das imagens', () => {
      const mockImg = new Image();
      mockImg.src = 'test.jpg';
      mockImg.onload = () => {};
      mockImg.onerror = () => {};
      
      imageCacheManager.addToCache('http://example.com/test.jpg', mockImg);
      imageCacheManager.clearCache();
      
      // Após clearCache, as referências são limpas
      // O src pode ser vazio ou o valor anterior dependendo do browser
      expect(mockImg.onload).toBeNull();
      expect(mockImg.onerror).toBeNull();
    });

    it('deve logar mensagem de limpeza', () => {
      imageCacheManager.clearCache();
      expect(console.log).toHaveBeenCalledWith('[ImageCache] Cache limpo');
    });
  });

  describe('clearCacheForUrls', () => {
    it('deve limpar URLs específicas', () => {
      const mockImg1 = new Image();
      const mockImg2 = new Image();
      const mockImg3 = new Image();
      
      imageCacheManager.addToCache('http://example.com/test1.jpg', mockImg1);
      imageCacheManager.addToCache('http://example.com/test2.jpg', mockImg2);
      imageCacheManager.addToCache('http://example.com/test3.jpg', mockImg3);
      
      expect(imageCacheManager.getCacheSize()).toBe(3);
      
      imageCacheManager.clearCacheForUrls([
        'http://example.com/test1.jpg',
        'http://example.com/test2.jpg'
      ]);
      
      expect(imageCacheManager.getCacheSize()).toBe(1);
      expect(imageCacheManager.getFromCache('http://example.com/test1.jpg')).toBeNull();
      expect(imageCacheManager.getFromCache('http://example.com/test2.jpg')).toBeNull();
      expect(imageCacheManager.getFromCache('http://example.com/test3.jpg')).toBe(mockImg3);
    });

    it('deve ignorar URLs que não estão no cache', () => {
      const mockImg = new Image();
      imageCacheManager.addToCache('http://example.com/test.jpg', mockImg);
      
      // Não deve lançar erro
      expect(() => {
        imageCacheManager.clearCacheForUrls(['http://example.com/notfound.jpg']);
      }).not.toThrow();
      
      expect(imageCacheManager.getCacheSize()).toBe(1);
    });

    it('deve limpar referências das imagens', () => {
      const mockImg = new Image();
      mockImg.src = 'test.jpg';
      mockImg.onload = () => {};
      mockImg.onerror = () => {};
      
      imageCacheManager.addToCache('http://example.com/test.jpg', mockImg);
      imageCacheManager.clearCacheForUrls(['http://example.com/test.jpg']);
      
      // Após clearCacheForUrls, as referências são limpas
      expect(mockImg.onload).toBeNull();
      expect(mockImg.onerror).toBeNull();
    });
  });

  describe('getCacheSize', () => {
    it('deve retornar 0 para cache vazio', () => {
      expect(imageCacheManager.getCacheSize()).toBe(0);
    });

    it('deve retornar número correto de itens', () => {
      for (let i = 0; i < 10; i++) {
        const mockImg = new Image();
        imageCacheManager.addToCache(`http://example.com/test${i}.jpg`, mockImg);
      }
      
      expect(imageCacheManager.getCacheSize()).toBe(10);
    });
  });
});
