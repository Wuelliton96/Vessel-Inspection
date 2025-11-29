/**
 * Testes abrangentes para cepUtils.ts
 */

import { buscarCEP, formatarCEP, validarCEP, CEPData } from '../cepUtils';

// Mock do fetch global
global.fetch = jest.fn();

describe('cepUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('buscarCEP', () => {
    it('deve buscar CEP válido e retornar dados', async () => {
      const mockCEPData: CEPData = {
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        complemento: 'de 1047 a 1865 - lado ímpar',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCEPData)
      });

      const result = await buscarCEP('01310100');

      expect(result).toEqual(mockCEPData);
      expect(global.fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');
    });

    it('deve aceitar CEP com formatação', async () => {
      const mockCEPData: CEPData = {
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        complemento: '',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCEPData)
      });

      const result = await buscarCEP('01310-100');

      expect(result).toEqual(mockCEPData);
      expect(global.fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');
    });

    it('deve lançar erro para CEP com menos de 8 dígitos', async () => {
      await expect(buscarCEP('01310')).rejects.toThrow('CEP deve ter 8 dígitos');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve lançar erro para CEP com mais de 8 dígitos', async () => {
      await expect(buscarCEP('013101001')).rejects.toThrow('CEP deve ter 8 dígitos');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve lançar erro para CEP vazio', async () => {
      await expect(buscarCEP('')).rejects.toThrow('CEP deve ter 8 dígitos');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando API retorna erro', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      await expect(buscarCEP('01310100')).rejects.toThrow('Erro ao consultar CEP');
    });

    it('deve lançar erro quando CEP não encontrado', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ erro: true })
      });

      await expect(buscarCEP('00000000')).rejects.toThrow('CEP não encontrado');
    });

    it('deve lançar erro quando fetch falha', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(buscarCEP('01310100')).rejects.toThrow('Network error');
    });

    it('deve logar erro no console', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Test error'));

      try {
        await buscarCEP('01310100');
      } catch (e) {
        // Esperado
      }

      expect(console.error).toHaveBeenCalledWith('Erro ao buscar CEP:', expect.any(Error));
    });
  });

  describe('formatarCEP', () => {
    it('deve formatar CEP de 8 dígitos', () => {
      expect(formatarCEP('01310100')).toBe('01310-100');
    });

    it('deve formatar CEP já formatado', () => {
      expect(formatarCEP('01310-100')).toBe('01310-100');
    });

    it('deve retornar CEP curto sem formatação', () => {
      expect(formatarCEP('01310')).toBe('01310');
    });

    it('deve retornar CEP com 4 dígitos sem formatação', () => {
      expect(formatarCEP('0131')).toBe('0131');
    });

    it('deve retornar CEP com 1 dígito sem formatação', () => {
      expect(formatarCEP('0')).toBe('0');
    });

    it('deve retornar string vazia para string vazia', () => {
      expect(formatarCEP('')).toBe('');
    });

    it('deve remover caracteres não numéricos antes de formatar', () => {
      expect(formatarCEP('01.310-100')).toBe('01310-100');
      expect(formatarCEP('CEP: 01310100')).toBe('01310-100');
    });

    it('deve formatar CEP com mais de 8 dígitos (pega apenas os primeiros 8)', () => {
      expect(formatarCEP('013101001')).toBe('01310-100');
    });

    it('deve formatar CEP com 6 dígitos', () => {
      expect(formatarCEP('013101')).toBe('01310-1');
    });

    it('deve formatar CEP com 7 dígitos', () => {
      expect(formatarCEP('0131010')).toBe('01310-10');
    });
  });

  describe('validarCEP', () => {
    it('deve retornar true para CEP de 8 dígitos', () => {
      expect(validarCEP('01310100')).toBe(true);
    });

    it('deve retornar true para CEP formatado', () => {
      expect(validarCEP('01310-100')).toBe(true);
    });

    it('deve retornar false para CEP com menos de 8 dígitos', () => {
      expect(validarCEP('01310')).toBe(false);
    });

    it('deve retornar false para CEP com mais de 8 dígitos', () => {
      expect(validarCEP('013101001')).toBe(false);
    });

    it('deve retornar false para string vazia', () => {
      expect(validarCEP('')).toBe(false);
    });

    it('deve ignorar caracteres não numéricos na validação', () => {
      expect(validarCEP('01.310-100')).toBe(true);
      expect(validarCEP('CEP: 01310100')).toBe(true);
    });

    it('deve retornar false para CEP com apenas letras', () => {
      expect(validarCEP('abcdefgh')).toBe(false);
    });

    it('deve validar CEP com espaços', () => {
      expect(validarCEP('01310 100')).toBe(true);
    });
  });
});

