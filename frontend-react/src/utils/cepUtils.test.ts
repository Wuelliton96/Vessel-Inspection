import { buscarCEP, formatarCEP, validarCEP } from './cepUtils';

// Mock do fetch
global.fetch = jest.fn();

describe('cepUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatarCEP', () => {
    test('formats CEP correctly', () => {
      expect(formatarCEP('12345678')).toBe('12345-678');
      expect(formatarCEP('12345-678')).toBe('12345-678');
    });

    test('handles empty or invalid input', () => {
      expect(formatarCEP('')).toBe('');
      expect(formatarCEP('123')).toBe('123');
    });
  });

  describe('validarCEP', () => {
    test('validates CEP correctly', () => {
      expect(validarCEP('12345678')).toBe(true);
      expect(validarCEP('12345-678')).toBe(true);
      expect(validarCEP('123')).toBe(false);
      expect(validarCEP('')).toBe(false);
    });
  });

  describe('buscarCEP', () => {
    test('fetches CEP data successfully', async () => {
      const mockResponse = {
        cep: '12345-678',
        logradouro: 'Rua Teste',
        complemento: '',
        bairro: 'Bairro Teste',
        localidade: 'Cidade Teste',
        uf: 'ST',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await buscarCEP('12345678');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('12345678')
      );
    });

    test('handles API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(buscarCEP('00000000')).rejects.toThrow();
    });

    test('handles CEP not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ erro: true }),
      });

      await expect(buscarCEP('12345678')).rejects.toThrow('CEP não encontrado');
    });

    test('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(buscarCEP('12345678')).rejects.toThrow('Network error');
    });

    test('handles invalid CEP length', async () => {
      await expect(buscarCEP('123')).rejects.toThrow('CEP deve ter 8 dígitos');
    });
  });
});

