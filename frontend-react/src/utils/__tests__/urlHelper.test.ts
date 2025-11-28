import { normalizeUrl, buildImageUrl, buildImageUrlEndpoint } from '../urlHelper';

describe('normalizeUrl', () => {
  it('deve combinar baseUrl e path corretamente', () => {
    expect(normalizeUrl('http://localhost:3000', 'api/users')).toBe('http://localhost:3000/api/users');
  });

  it('deve remover barras duplas', () => {
    expect(normalizeUrl('http://localhost:3000/', '/api/users')).toBe('http://localhost:3000/api/users');
  });

  it('deve retornar path se baseUrl estiver vazio', () => {
    expect(normalizeUrl('', 'api/users')).toBe('api/users');
  });

  it('deve retornar baseUrl se path estiver vazio', () => {
    expect(normalizeUrl('http://localhost:3000', '')).toBe('http://localhost:3000');
  });
});

describe('buildImageUrl', () => {
  it('deve construir URL de imagem corretamente', () => {
    expect(buildImageUrl('http://localhost:3000', 123)).toBe('http://localhost:3000/api/fotos/123/imagem');
    expect(buildImageUrl('http://localhost:3000', '456')).toBe('http://localhost:3000/api/fotos/456/imagem');
  });
});

describe('buildImageUrlEndpoint', () => {
  it('deve construir URL de endpoint de imagem corretamente', () => {
    expect(buildImageUrlEndpoint('http://localhost:3000', 123)).toBe('http://localhost:3000/api/fotos/123/imagem-url');
    expect(buildImageUrlEndpoint('http://localhost:3000', '456')).toBe('http://localhost:3000/api/fotos/456/imagem-url');
  });
});

