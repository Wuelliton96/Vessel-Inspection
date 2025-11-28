import { preloadImage, preloadImages, useImagePreloader } from '../imagePreloader';
import { renderHook, waitFor } from '@testing-library/react';

// Mock fetch
global.fetch = jest.fn();
global.Image = jest.fn().mockImplementation(() => ({
  src: '',
  onload: null,
  onerror: null,
}));

// Mock URL.createObjectURL e URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test');
global.URL.revokeObjectURL = jest.fn();

describe('imagePreloader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('preloadImage', () => {
    it('deve retornar erro quando URL está vazia', async () => {
      const result = await preloadImage('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('URL vazia');
    });

    it('deve carregar imagem externa com sucesso', async () => {
      const mockImg = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImg);

      const promise = preloadImage('http://example.com/image.jpg');

      // Simular sucesso no carregamento
      setTimeout(() => {
        if (mockImg.onload) {
          mockImg.onload();
        }
      }, 10);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.url).toBe('http://example.com/image.jpg');
    });

    it('deve retornar erro quando imagem externa falha ao carregar', async () => {
      const mockImg = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImg);

      const promise = preloadImage('http://example.com/invalid.jpg');

      // Simular erro no carregamento
      setTimeout(() => {
        if (mockImg.onerror) {
          mockImg.onerror();
        }
      }, 10);

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro ao carregar imagem');
    });

    it('deve retornar timeout quando imagem externa demora muito', async () => {
      const mockImg = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImg);

      const promise = preloadImage('http://example.com/slow.jpg', 100);

      // Não simular onload/onerror para causar timeout
      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout ao carregar imagem');
    });

    it('deve carregar imagem da API com autenticação', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });
      const mockResponse = {
        ok: true,
        status: 200,
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const mockImg = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImg);

      localStorage.setItem('token', 'test-token');

      const promise = preloadImage('http://example.com/api/fotos/123');

      // Simular sucesso no carregamento do blob
      setTimeout(() => {
        if (mockImg.onload) {
          mockImg.onload();
        }
      }, 10);

      const result = await promise;

      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/api/fotos/123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );

      expect(result.success).toBe(true);
    });

    it('deve lidar com erro HTTP ao carregar imagem da API', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const mockImg = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImg);

      const promise = preloadImage('http://example.com/api/fotos/123');

      // Simular erro no carregamento após erro HTTP
      setTimeout(() => {
        if (mockImg.onerror) {
          mockImg.onerror();
        }
      }, 10);

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Erro HTTP 404');
    });

    it('deve lidar com timeout ao carregar imagem da API', async () => {
      const mockAbortController = {
        abort: jest.fn(),
        signal: {},
      };

      global.AbortController = jest.fn().mockImplementation(() => mockAbortController);

      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 50);
        });
      });

      const promise = preloadImage('http://example.com/api/fotos/123', 100);

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBe('Timeout ao carregar imagem');
    });

    it('deve normalizar URL removendo barras duplas', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });
      const mockResponse = {
        ok: true,
        status: 200,
        blob: jest.fn().mockResolvedValue(mockBlob),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const mockImg = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImg);

      const promise = preloadImage('http://example.com//api//fotos//123');

      setTimeout(() => {
        if (mockImg.onload) {
          mockImg.onload();
        }
      }, 10);

      await promise;

      expect(global.fetch).toHaveBeenCalledWith(
        'http://example.com/api/fotos/123',
        expect.any(Object)
      );
    });
  });

  describe('preloadImages', () => {
    it('deve carregar múltiplas imagens em paralelo', async () => {
      const mockImg = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImg);

      const urls = [
        'http://example.com/image1.jpg',
        'http://example.com/image2.jpg',
        'http://example.com/image3.jpg',
      ];

      const promise = preloadImages(urls);

      // Simular sucesso em todas as imagens
      setTimeout(() => {
        if (mockImg.onload) {
          mockImg.onload();
        }
      }, 10);

      const results = await promise;

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('useImagePreloader', () => {
    it('deve inicializar com estado correto', () => {
      const { result } = renderHook(() => useImagePreloader());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.loadedUrl).toBeNull();
      expect(typeof result.current.preload).toBe('function');
    });

    it('deve atualizar estado durante carregamento', async () => {
      const mockImg = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImg);

      const { result } = renderHook(() => useImagePreloader());

      const preloadPromise = result.current.preload('http://example.com/image.jpg');

      // Verificar que loading é true durante carregamento
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Simular sucesso
      setTimeout(() => {
        if (mockImg.onload) {
          mockImg.onload();
        }
      }, 10);

      await preloadPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.loadedUrl).toBe('http://example.com/image.jpg');
      });
    });

    it('deve atualizar estado de erro quando falha', async () => {
      const mockImg = {
        src: '',
        onload: null as any,
        onerror: null as any,
      };

      (global.Image as jest.Mock).mockImplementation(() => mockImg);

      const { result } = renderHook(() => useImagePreloader());

      const preloadPromise = result.current.preload('http://example.com/invalid.jpg');

      // Simular erro
      setTimeout(() => {
        if (mockImg.onerror) {
          mockImg.onerror();
        }
      }, 10);

      await preloadPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Erro ao carregar imagem');
        expect(result.current.loadedUrl).toBeNull();
      });
    });

    it('deve retornar null quando URL está vazia', async () => {
      const { result } = renderHook(() => useImagePreloader());

      const url = await result.current.preload('');

      expect(url).toBeNull();
      expect(result.current.error).toBe('URL vazia');
      expect(result.current.loading).toBe(false);
    });
  });
});

