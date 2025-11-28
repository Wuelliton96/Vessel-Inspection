import { imageCacheManager } from '../imageCache';

describe('ImageCacheManager', () => {
  beforeEach(() => {
    imageCacheManager.clearCache();
  });

  describe('addToCache', () => {
    it('deve adicionar imagem ao cache', () => {
      const img = new Image();
      imageCacheManager.addToCache('http://example.com/image.jpg', img);

      expect(imageCacheManager.getCacheSize()).toBe(1);
      expect(imageCacheManager.getFromCache('http://example.com/image.jpg')).toBe(img);
    });

    it('deve remover imagem mais antiga quando cache está cheio', () => {
      const maxSize = 50;
      
      // Adicionar 50 imagens
      for (let i = 0; i < maxSize; i++) {
        const img = new Image();
        imageCacheManager.addToCache(`http://example.com/image${i}.jpg`, img);
      }

      expect(imageCacheManager.getCacheSize()).toBe(maxSize);

      // Adicionar mais uma imagem
      const newImg = new Image();
      imageCacheManager.addToCache('http://example.com/image51.jpg', newImg);

      expect(imageCacheManager.getCacheSize()).toBe(maxSize);
      expect(imageCacheManager.getFromCache('http://example.com/image51.jpg')).toBe(newImg);
    });

    it('deve substituir imagem existente com mesma URL', () => {
      const img1 = new Image();
      const img2 = new Image();
      
      imageCacheManager.addToCache('http://example.com/image.jpg', img1);
      imageCacheManager.addToCache('http://example.com/image.jpg', img2);

      expect(imageCacheManager.getCacheSize()).toBe(1);
      expect(imageCacheManager.getFromCache('http://example.com/image.jpg')).toBe(img2);
    });
  });

  describe('getFromCache', () => {
    it('deve retornar imagem do cache quando existe', () => {
      const img = new Image();
      imageCacheManager.addToCache('http://example.com/image.jpg', img);

      const cachedImg = imageCacheManager.getFromCache('http://example.com/image.jpg');
      expect(cachedImg).toBe(img);
    });

    it('deve retornar null quando imagem não existe no cache', () => {
      const cachedImg = imageCacheManager.getFromCache('http://example.com/nonexistent.jpg');
      expect(cachedImg).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('deve limpar todo o cache', () => {
      const img1 = new Image();
      const img2 = new Image();
      
      imageCacheManager.addToCache('http://example.com/image1.jpg', img1);
      imageCacheManager.addToCache('http://example.com/image2.jpg', img2);

      expect(imageCacheManager.getCacheSize()).toBe(2);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      imageCacheManager.clearCache();

      expect(imageCacheManager.getCacheSize()).toBe(0);
      expect(imageCacheManager.getFromCache('http://example.com/image1.jpg')).toBeNull();
      expect(imageCacheManager.getFromCache('http://example.com/image2.jpg')).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith('[ImageCache] Cache limpo');

      consoleLogSpy.mockRestore();
    });

    it('deve limpar referências das imagens ao limpar cache', () => {
      const img = new Image();
      img.src = 'http://example.com/image.jpg';
      img.onload = jest.fn();
      img.onerror = jest.fn();

      imageCacheManager.addToCache('http://example.com/image.jpg', img);
      imageCacheManager.clearCache();

      expect(img.src).toBe('');
      expect(img.onload).toBeNull();
      expect(img.onerror).toBeNull();
    });
  });

  describe('clearCacheForUrls', () => {
    it('deve limpar cache apenas para URLs especificadas', () => {
      const img1 = new Image();
      const img2 = new Image();
      const img3 = new Image();
      
      imageCacheManager.addToCache('http://example.com/image1.jpg', img1);
      imageCacheManager.addToCache('http://example.com/image2.jpg', img2);
      imageCacheManager.addToCache('http://example.com/image3.jpg', img3);

      expect(imageCacheManager.getCacheSize()).toBe(3);

      imageCacheManager.clearCacheForUrls([
        'http://example.com/image1.jpg',
        'http://example.com/image2.jpg',
      ]);

      expect(imageCacheManager.getCacheSize()).toBe(1);
      expect(imageCacheManager.getFromCache('http://example.com/image1.jpg')).toBeNull();
      expect(imageCacheManager.getFromCache('http://example.com/image2.jpg')).toBeNull();
      expect(imageCacheManager.getFromCache('http://example.com/image3.jpg')).toBe(img3);
    });

    it('deve limpar referências das imagens ao limpar URLs específicas', () => {
      const img = new Image();
      img.src = 'http://example.com/image.jpg';
      img.onload = jest.fn();
      img.onerror = jest.fn();

      imageCacheManager.addToCache('http://example.com/image.jpg', img);
      imageCacheManager.clearCacheForUrls(['http://example.com/image.jpg']);

      expect(img.src).toBe('');
      expect(img.onload).toBeNull();
      expect(img.onerror).toBeNull();
    });

    it('não deve fazer nada quando URL não existe no cache', () => {
      const img = new Image();
      imageCacheManager.addToCache('http://example.com/image1.jpg', img);

      imageCacheManager.clearCacheForUrls(['http://example.com/nonexistent.jpg']);

      expect(imageCacheManager.getCacheSize()).toBe(1);
      expect(imageCacheManager.getFromCache('http://example.com/image1.jpg')).toBe(img);
    });
  });

  describe('getCacheSize', () => {
    it('deve retornar 0 quando cache está vazio', () => {
      expect(imageCacheManager.getCacheSize()).toBe(0);
    });

    it('deve retornar tamanho correto do cache', () => {
      imageCacheManager.addToCache('http://example.com/image1.jpg', new Image());
      imageCacheManager.addToCache('http://example.com/image2.jpg', new Image());
      imageCacheManager.addToCache('http://example.com/image3.jpg', new Image());

      expect(imageCacheManager.getCacheSize()).toBe(3);
    });
  });
});

