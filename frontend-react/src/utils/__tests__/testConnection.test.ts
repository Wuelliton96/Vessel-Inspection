import { testBackendConnection, testAuthEndpoint } from '../testConnection';
import { API_CONFIG } from '../../config/api';

// Mock fetch
global.fetch = jest.fn();

// Mock console
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

describe('testConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('testBackendConnection', () => {
    it('deve retornar true quando backend responde com sucesso', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await testBackendConnection();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(API_CONFIG.BASE_URL, {
        method: 'GET',
        mode: 'cors',
      });
      expect(consoleLogSpy).toHaveBeenCalledWith('Testando conexão com backend...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Response status:', 200);
      expect(consoleLogSpy).toHaveBeenCalledWith('Response ok:', true);
    });

    it('deve retornar false quando backend responde com erro', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await testBackendConnection();

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('Response status:', 500);
      expect(consoleLogSpy).toHaveBeenCalledWith('Response ok:', false);
    });

    it('deve retornar false quando há erro de conexão', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await testBackendConnection();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao conectar com o backend:',
        expect.any(Error)
      );
    });

    it('deve retornar false quando fetch lança exceção', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));

      const result = await testBackendConnection();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('testAuthEndpoint', () => {
    it('deve retornar true quando endpoint responde com 200', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ token: 'test-token' }),
      });

      const result = await testAuthEndpoint();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_CONFIG.BASE_URL}/api/auth/login`,
        expect.objectContaining({
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@sgvn.com',
            senha: 'admin123',
          }),
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Testando endpoint de auth...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Auth response status:', 200);
      expect(consoleLogSpy).toHaveBeenCalledWith('Auth response ok:', true);
    });

    it('deve retornar true quando endpoint responde com 401 (credenciais incorretas)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Credenciais inválidas' }),
      });

      const result = await testAuthEndpoint();

      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith('Auth response status:', 401);
      expect(consoleLogSpy).toHaveBeenCalledWith('Auth response ok:', false);
    });

    it('deve retornar false quando endpoint responde com outro status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Internal server error' }),
      });

      const result = await testAuthEndpoint();

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('Auth response status:', 500);
    });

    it('deve retornar false quando há erro de conexão', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await testAuthEndpoint();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erro ao testar endpoint de auth:',
        expect.any(Error)
      );
    });

    it('deve logar dados da resposta quando disponível', async () => {
      const responseData = { token: 'test-token', user: { id: 1 } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(responseData),
      });

      await testAuthEndpoint();

      expect(consoleLogSpy).toHaveBeenCalledWith('Auth response data:', responseData);
    });
  });
});

