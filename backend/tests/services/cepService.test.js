const { buscarEnderecoPorCEP, buscarCEPPorEndereco } = require('../../services/cepService');
const axios = require('axios');

jest.mock('axios');

describe('CEP Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buscarEnderecoPorCEP', () => {
    it('deve buscar endereço por CEP válido', async () => {
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
      expect(resultado.logradouro).toBe('Avenida Paulista');
      expect(resultado.cidade).toBe('São Paulo');
      expect(resultado.uf).toBe('SP');
    });

    it('deve aceitar CEP formatado', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          localidade: 'São Paulo',
          uf: 'SP'
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const resultado = await buscarEnderecoPorCEP('01310-100');

      expect(resultado).toBeDefined();
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('01310100'),
        expect.any(Object)
      );
    });

    it('deve lançar erro para CEP inválido (menos de 8 dígitos)', async () => {
      await expect(buscarEnderecoPorCEP('12345')).rejects.toThrow('CEP invalido');
    });

    it('deve lançar erro para CEP inválido (mais de 8 dígitos)', async () => {
      await expect(buscarEnderecoPorCEP('123456789')).rejects.toThrow('CEP invalido');
    });

    it('deve lançar erro quando CEP não encontrado', async () => {
      const mockResponse = {
        data: {
          erro: true
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      await expect(buscarEnderecoPorCEP('00000000')).rejects.toThrow('CEP nao encontrado');
    });

    it('deve tratar erro de conexão', async () => {
      axios.get.mockRejectedValue({ request: {} });

      await expect(buscarEnderecoPorCEP('01310100')).rejects.toThrow('Erro de conexao');
    });

    it('deve tratar erro de resposta da API', async () => {
      axios.get.mockRejectedValue({ response: { status: 500 } });

      await expect(buscarEnderecoPorCEP('01310100')).rejects.toThrow('Erro ao consultar CEP');
    });

    it('deve remover caracteres não numéricos do CEP', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          localidade: 'São Paulo',
          uf: 'SP'
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      await buscarEnderecoPorCEP('013.101-00');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('01310100'),
        expect.any(Object)
      );
    });
  });

  describe('buscarCEPPorEndereco', () => {
    it('deve buscar CEP por endereço válido', async () => {
      const mockResponse = {
        data: [
          {
            cep: '01310-100',
            logradouro: 'Avenida Paulista',
            complemento: '',
            bairro: 'Bela Vista',
            localidade: 'São Paulo',
            uf: 'SP',
            ibge: '3550308'
          }
        ]
      };

      axios.get.mockResolvedValue(mockResponse);

      const resultado = await buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista');

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBeGreaterThan(0);
      expect(resultado[0].cep).toBe('01310-100');
      expect(resultado[0].cidade).toBe('São Paulo');
    });

    it('deve lançar erro sem UF', async () => {
      await expect(buscarCEPPorEndereco('', 'São Paulo', 'Avenida Paulista')).rejects.toThrow('obrigatorios');
    });

    it('deve lançar erro sem cidade', async () => {
      await expect(buscarCEPPorEndereco('SP', '', 'Avenida Paulista')).rejects.toThrow('obrigatorios');
    });

    it('deve lançar erro sem logradouro', async () => {
      await expect(buscarCEPPorEndereco('SP', 'São Paulo', '')).rejects.toThrow('obrigatorios');
    });

    it('deve lançar erro para UF inválida (menos de 2 letras)', async () => {
      await expect(buscarCEPPorEndereco('S', 'São Paulo', 'Avenida Paulista')).rejects.toThrow('2 letras');
    });

    it('deve lançar erro para logradouro muito curto', async () => {
      await expect(buscarCEPPorEndereco('SP', 'São Paulo', 'AB')).rejects.toThrow('3 caracteres');
    });

    it('deve lançar erro quando nenhum CEP encontrado', async () => {
      const mockResponse = {
        data: []
      };

      axios.get.mockResolvedValue(mockResponse);

      await expect(buscarCEPPorEndereco('SP', 'São Paulo', 'Rua Inexistente')).rejects.toThrow('Nenhum CEP encontrado');
    });

    it('deve tratar erro de conexão', async () => {
      axios.get.mockRejectedValue({ request: {} });

      await expect(buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista')).rejects.toThrow('Erro de conexao');
    });

    it('deve tratar erro de resposta da API', async () => {
      axios.get.mockRejectedValue({ response: { status: 500 } });

      await expect(buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista')).rejects.toThrow('Erro ao buscar CEP');
    });

    it('deve retornar múltiplos endereços quando encontrados', async () => {
      const mockResponse = {
        data: [
          {
            cep: '01310-100',
            logradouro: 'Avenida Paulista',
            localidade: 'São Paulo',
            uf: 'SP',
            ibge: '3550308'
          },
          {
            cep: '01310-200',
            logradouro: 'Avenida Paulista',
            localidade: 'São Paulo',
            uf: 'SP',
            ibge: '3550308'
          }
        ]
      };

      axios.get.mockResolvedValue(mockResponse);

      const resultado = await buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista');

      expect(resultado.length).toBe(2);
      expect(resultado[0].cep).toBe('01310-100');
      expect(resultado[1].cep).toBe('01310-200');
    });
  });
});
