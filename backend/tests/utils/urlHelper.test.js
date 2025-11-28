const { normalizeUrl, buildImageUrl, buildImageUrlEndpoint } = require('../../utils/urlHelper');

describe('URL Helper', () => {
  describe('normalizeUrl', () => {
    it('deve retornar path quando baseUrl não existe', () => {
      expect(normalizeUrl(null, '/path')).toBe('/path');
      expect(normalizeUrl(undefined, '/path')).toBe('/path');
      expect(normalizeUrl('', '/path')).toBe('/path');
    });

    it('deve retornar baseUrl quando path não existe', () => {
      expect(normalizeUrl('http://example.com', null)).toBe('http://example.com');
      expect(normalizeUrl('http://example.com', undefined)).toBe('http://example.com');
      expect(normalizeUrl('http://example.com', '')).toBe('http://example.com');
    });

    it('deve remover barras duplas', () => {
      expect(normalizeUrl('http://example.com', '/path')).toBe('http://example.com/path');
      expect(normalizeUrl('http://example.com/', '/path')).toBe('http://example.com/path');
      expect(normalizeUrl('http://example.com', 'path')).toBe('http://example.com/path');
    });

    it('deve remover múltiplas barras', () => {
      expect(normalizeUrl('http://example.com//', '//path')).toBe('http://example.com/path');
      expect(normalizeUrl('http://example.com///', '///path')).toBe('http://example.com/path');
    });

    it('deve preservar protocolo http://', () => {
      expect(normalizeUrl('http://example.com', '/path')).toBe('http://example.com/path');
    });

    it('deve preservar protocolo https://', () => {
      expect(normalizeUrl('https://example.com', '/path')).toBe('https://example.com/path');
    });
  });

  describe('buildImageUrl', () => {
    it('deve construir URL de imagem corretamente', () => {
      expect(buildImageUrl('http://example.com', 123)).toBe('http://example.com/api/fotos/123/imagem');
      expect(buildImageUrl('https://api.example.com', 456)).toBe('https://api.example.com/api/fotos/456/imagem');
    });

    it('deve lidar com baseUrl com barra final', () => {
      expect(buildImageUrl('http://example.com/', 123)).toBe('http://example.com/api/fotos/123/imagem');
    });

    it('deve funcionar sem baseUrl', () => {
      expect(buildImageUrl(null, 123)).toBe('/api/fotos/123/imagem');
    });
  });

  describe('buildImageUrlEndpoint', () => {
    it('deve construir URL de endpoint de imagem corretamente', () => {
      expect(buildImageUrlEndpoint('http://example.com', 123)).toBe('http://example.com/api/fotos/123/imagem-url');
      expect(buildImageUrlEndpoint('https://api.example.com', 456)).toBe('https://api.example.com/api/fotos/456/imagem-url');
    });

    it('deve lidar com baseUrl com barra final', () => {
      expect(buildImageUrlEndpoint('http://example.com/', 123)).toBe('http://example.com/api/fotos/123/imagem-url');
    });

    it('deve funcionar sem baseUrl', () => {
      expect(buildImageUrlEndpoint(null, 123)).toBe('/api/fotos/123/imagem-url');
    });
  });
});

