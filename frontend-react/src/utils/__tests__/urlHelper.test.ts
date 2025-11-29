/**
 * Testes para urlHelper.ts
 */

import { normalizeUrl, buildImageUrl, buildImageUrlEndpoint } from '../urlHelper';

describe('urlHelper', () => {
  describe('normalizeUrl', () => {
    it('deve combinar baseUrl e path corretamente', () => {
      expect(normalizeUrl('http://example.com', 'api/test')).toBe('http://example.com/api/test');
      expect(normalizeUrl('http://example.com/', '/api/test')).toBe('http://example.com/api/test');
    });

    it('deve remover barras duplas', () => {
      expect(normalizeUrl('http://example.com/', '/api//test')).toBe('http://example.com/api/test');
    });

    it('deve preservar protocolo https://', () => {
      const result = normalizeUrl('https://example.com', 'api/test');
      expect(result).toContain('https://');
    });

    it('deve retornar path se baseUrl vazio', () => {
      expect(normalizeUrl('', '/api/test')).toBe('/api/test');
    });

    it('deve retornar baseUrl se path vazio', () => {
      expect(normalizeUrl('http://example.com', '')).toBe('http://example.com');
    });

    it('deve lidar com múltiplas barras no path', () => {
      const result = normalizeUrl('http://example.com', '//api///test');
      expect(result).not.toContain('///');
    });
  });

  describe('buildImageUrl', () => {
    it('deve construir URL de imagem corretamente', () => {
      expect(buildImageUrl('http://api.example.com', 123))
        .toBe('http://api.example.com/api/fotos/123/imagem');
    });

    it('deve aceitar fotoId como string', () => {
      expect(buildImageUrl('http://api.example.com', '456'))
        .toBe('http://api.example.com/api/fotos/456/imagem');
    });

    it('deve normalizar URL com barras extras', () => {
      const result = buildImageUrl('http://api.example.com/', 123);
      expect(result).toBe('http://api.example.com/api/fotos/123/imagem');
    });
  });

  describe('buildImageUrlEndpoint', () => {
    it('deve construir endpoint de imagem-url corretamente', () => {
      expect(buildImageUrlEndpoint('http://api.example.com', 123))
        .toBe('http://api.example.com/api/fotos/123/imagem-url');
    });

    it('deve aceitar fotoId como string', () => {
      expect(buildImageUrlEndpoint('http://api.example.com', '789'))
        .toBe('http://api.example.com/api/fotos/789/imagem-url');
    });
  });
});
