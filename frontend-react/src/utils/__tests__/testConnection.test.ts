/**
 * Testes para testConnection.ts
 */

import { testBackendConnection, testAuthEndpoint } from '../testConnection';

// Mock do fetch global
global.fetch = jest.fn();

// Mock do API_CONFIG
jest.mock('../../config/api', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:3000'
  }
}));

describe('testConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('testBackendConnection', () => {
    it('deve retornar true quando conexão OK', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await testBackendConnection();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000', {
        method: 'GET',
        mode: 'cors'
      });
    });

    it('deve retornar false quando response não OK', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      const result = await testBackendConnection();

      expect(result).toBe(false);
    });

    it('deve retornar false quando fetch falha', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await testBackendConnection();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('deve logar informações de conexão', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200
      });

      await testBackendConnection();

      expect(console.log).toHaveBeenCalledWith('Testando conexão com backend...');
      expect(console.log).toHaveBeenCalledWith('Response status:', 200);
      expect(console.log).toHaveBeenCalledWith('Response ok:', true);
    });
  });

  describe('testAuthEndpoint', () => {
    it('deve retornar true quando status 200', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ token: 'test-token' })
      });

      const result = await testAuthEndpoint();

      expect(result).toBe(true);
    });

    it('deve retornar true quando status 401 (endpoint funcionando mas credenciais erradas)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      });

      const result = await testAuthEndpoint();

      expect(result).toBe(true);
    });

    it('deve retornar false para outros status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      });

      const result = await testAuthEndpoint();

      expect(result).toBe(false);
    });

    it('deve retornar false quando fetch falha', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await testAuthEndpoint();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('deve enviar request POST com JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      });

      await testAuthEndpoint();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.any(String)
        })
      );
    });

    it('deve logar informações do auth', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true })
      });

      await testAuthEndpoint();

      expect(console.log).toHaveBeenCalledWith('Testando endpoint de auth...');
      expect(console.log).toHaveBeenCalledWith('Auth response status:', 200);
    });
  });
});
