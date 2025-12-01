/**
 * Testes abrangentes para utils/cepUtils.ts
 */

import { formatarCEP, validarCEP, buscarCEP } from '../cepUtils';

// Mock do fetch
global.fetch = jest.fn();

describe('CEP Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('formatarCEP', () => {
    it('deve formatar CEP com 8 dígitos', () => {
      expect(formatarCEP('01310100')).toBe('01310-100');
    });

    it('deve remover caracteres não numéricos', () => {
      expect(formatarCEP('01.310-100')).toBe('01310-100');
    });

    it('deve retornar string parcial para menos dígitos', () => {
      expect(formatarCEP('01310')).toBe('01310');
    });

    it('deve retornar string vazia para undefined', () => {
      expect(formatarCEP(undefined as any)).toBe('');
    });

    it('deve retornar string vazia para string vazia', () => {
      expect(formatarCEP('')).toBe('');
    });

    it('deve limitar a 9 caracteres após formatação', () => {
      expect(formatarCEP('012345678901')).toBe('01234-567');
    });
  });

  describe('validarCEP', () => {
    it('deve retornar true para CEP válido com 8 dígitos', () => {
      expect(validarCEP('01310100')).toBe(true);
    });

    it('deve retornar true para CEP formatado', () => {
      expect(validarCEP('01310-100')).toBe(true);
    });

    it('deve retornar false para CEP com menos de 8 dígitos', () => {
      expect(validarCEP('0131010')).toBe(false);
    });

    it('deve retornar false para CEP com mais de 8 dígitos', () => {
      expect(validarCEP('013101001')).toBe(false);
    });

    it('deve retornar false para string vazia', () => {
      expect(validarCEP('')).toBe(false);
    });

    it('deve retornar false para undefined', () => {
      expect(validarCEP(undefined as any)).toBe(false);
    });

    it('deve retornar false para null', () => {
      expect(validarCEP(null as any)).toBe(false);
    });
  });

  describe('buscarCEP', () => {
    it('deve retornar dados do CEP quando encontrado', async () => {
      const mockResponse = {
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await buscarCEP('01310100');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');
    });

    it('deve retornar null quando CEP não é encontrado', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ erro: true }),
      });

      const result = await buscarCEP('00000000');

      expect(result).toBeNull();
    });

    it('deve retornar null quando ocorre erro na requisição', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await buscarCEP('01310100');

      expect(result).toBeNull();
    });

    it('deve retornar null para CEP inválido', async () => {
      const result = await buscarCEP('123');

      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve retornar null para CEP vazio', async () => {
      const result = await buscarCEP('');

      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve limpar formatação antes de buscar', async () => {
      const mockResponse = {
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await buscarCEP('01310-100');

      expect(global.fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');
    });

    it('deve retornar null quando response não é ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await buscarCEP('01310100');

      expect(result).toBeNull();
    });
  });
});
