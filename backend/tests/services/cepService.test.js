const axios = require('axios');
const { buscarEnderecoPorCEP } = require('../../services/cepService');

// Mock do axios
jest.mock('axios');

describe('CEP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buscarEnderecoPorCEP', () => {
    it('deve buscar endereço com CEP válido', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          complemento: '',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP',
          ibge: '3550308',
          gia: '1004',
          ddd: '11',
          siafi: '7107'
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const resultado = await buscarEnderecoPorCEP('01310100');

      expect(resultado).toBeDefined();
      expect(resultado.cep).toBe('01310-100');
      expect(resultado.cidade).toBe('São Paulo');
      expect(resultado.uf).toBe('SP');
      expect(axios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/01310100/json/',
        { timeout: 5000 }
      );
    });

    it('deve aceitar CEP formatado', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP'
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const resultado = await buscarEnderecoPorCEP('01310-100');

      expect(resultado).toBeDefined();
      expect(axios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/01310100/json/',
        { timeout: 5000 }
      );
    });

    it('deve lançar erro para CEP inválido (menos de 8 dígitos)', async () => {
      await expect(buscarEnderecoPorCEP('12345')).rejects.toThrow('CEP invalido');
    });

    it('deve lançar erro para CEP não encontrado', async () => {
      axios.get.mockResolvedValue({
        data: { erro: true }
      });

      await expect(buscarEnderecoPorCEP('00000000')).rejects.toThrow('CEP nao encontrado');
    });

    it('deve lançar erro em caso de falha na requisição', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));

      await expect(buscarEnderecoPorCEP('01310100')).rejects.toThrow();
    });
  });
});

