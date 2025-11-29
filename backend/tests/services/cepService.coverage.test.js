/**
 * Testes abrangentes para cepService
 * Objetivo: Aumentar cobertura de testes para > 75%
 */
const axios = require('axios');

// Mock axios antes de importar o service
jest.mock('axios');

const cepService = require('../../services/cepService');

describe('cepService - Testes de Cobertura', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('buscarEnderecoPorCEP', () => {
    it('deve buscar endereco com CEP valido (formato sem hifen)', async () => {
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

      const result = await cepService.buscarEnderecoPorCEP('01310100');

      expect(result).toEqual({
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        complemento: '',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
        ibge: '3550308',
        gia: '1004',
        ddd: '11',
        siafi: '7107'
      });
      expect(axios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/01310100/json/',
        { timeout: 5000 }
      );
    });

    it('deve buscar endereco com CEP com hifen', async () => {
      const mockResponse = {
        data: {
          cep: '22041-001',
          logradouro: 'Avenida Atlântica',
          complemento: 'até 1999 - lado ímpar',
          bairro: 'Copacabana',
          localidade: 'Rio de Janeiro',
          uf: 'RJ',
          ibge: '3304557',
          gia: '',
          ddd: '21',
          siafi: '6001'
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await cepService.buscarEnderecoPorCEP('22041-001');

      expect(result.cidade).toBe('Rio de Janeiro');
      expect(result.uf).toBe('RJ');
      expect(axios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/22041001/json/',
        { timeout: 5000 }
      );
    });

    it('deve lançar erro para CEP invalido (menos de 8 digitos)', async () => {
      await expect(cepService.buscarEnderecoPorCEP('1234')).rejects.toThrow(
        'CEP invalido. Deve conter 8 digitos.'
      );
    });

    it('deve lançar erro para CEP invalido (mais de 8 digitos)', async () => {
      await expect(cepService.buscarEnderecoPorCEP('123456789')).rejects.toThrow(
        'CEP invalido. Deve conter 8 digitos.'
      );
    });

    it('deve lançar erro para CEP vazio', async () => {
      await expect(cepService.buscarEnderecoPorCEP('')).rejects.toThrow(
        'CEP invalido. Deve conter 8 digitos.'
      );
    });

    it('deve lançar erro quando CEP nao encontrado', async () => {
      axios.get.mockResolvedValue({ data: { erro: true } });

      await expect(cepService.buscarEnderecoPorCEP('99999999')).rejects.toThrow(
        'CEP nao encontrado'
      );
    });

    it('deve lançar erro quando API retorna erro HTTP', async () => {
      axios.get.mockRejectedValue({
        response: { status: 500 }
      });

      await expect(cepService.buscarEnderecoPorCEP('01310100')).rejects.toThrow(
        'Erro ao consultar CEP. Tente novamente.'
      );
    });

    it('deve lançar erro quando há erro de conexão', async () => {
      axios.get.mockRejectedValue({
        request: {}
      });

      await expect(cepService.buscarEnderecoPorCEP('01310100')).rejects.toThrow(
        'Erro de conexao com servico de CEP. Verifique sua internet.'
      );
    });

    it('deve relançar erro genérico', async () => {
      const errorMessage = 'Erro genérico';
      axios.get.mockRejectedValue(new Error(errorMessage));

      await expect(cepService.buscarEnderecoPorCEP('01310100')).rejects.toThrow(errorMessage);
    });

    it('deve remover caracteres especiais do CEP', async () => {
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

      await cepService.buscarEnderecoPorCEP('013.10-100');

      expect(axios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/01310100/json/',
        { timeout: 5000 }
      );
    });
  });

  describe('buscarCEPPorEndereco', () => {
    it('deve buscar CEP por endereco valido', async () => {
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
          },
          {
            cep: '01310-200',
            logradouro: 'Avenida Paulista',
            complemento: 'lado par',
            bairro: 'Bela Vista',
            localidade: 'São Paulo',
            uf: 'SP',
            ibge: '3550308'
          }
        ]
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista');

      expect(result).toHaveLength(2);
      expect(result[0].cidade).toBe('São Paulo');
      expect(result[0].uf).toBe('SP');
    });

    it('deve lançar erro quando UF não é fornecido', async () => {
      await expect(cepService.buscarCEPPorEndereco('', 'São Paulo', 'Paulista')).rejects.toThrow(
        'UF, cidade e logradouro sao obrigatorios'
      );
    });

    it('deve lançar erro quando cidade não é fornecida', async () => {
      await expect(cepService.buscarCEPPorEndereco('SP', '', 'Paulista')).rejects.toThrow(
        'UF, cidade e logradouro sao obrigatorios'
      );
    });

    it('deve lançar erro quando logradouro não é fornecido', async () => {
      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', '')).rejects.toThrow(
        'UF, cidade e logradouro sao obrigatorios'
      );
    });

    it('deve lançar erro quando UF tem mais de 2 letras', async () => {
      await expect(cepService.buscarCEPPorEndereco('SPP', 'São Paulo', 'Paulista')).rejects.toThrow(
        'UF deve ter 2 letras'
      );
    });

    it('deve lançar erro quando UF tem menos de 2 letras', async () => {
      await expect(cepService.buscarCEPPorEndereco('S', 'São Paulo', 'Paulista')).rejects.toThrow(
        'UF deve ter 2 letras'
      );
    });

    it('deve lançar erro quando logradouro tem menos de 3 caracteres', async () => {
      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Pa')).rejects.toThrow(
        'Logradouro deve ter no minimo 3 caracteres'
      );
    });

    it('deve lançar erro quando nenhum CEP é encontrado (array vazio)', async () => {
      axios.get.mockResolvedValue({ data: [] });

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Rua Inexistente')).rejects.toThrow(
        'Nenhum CEP encontrado para este endereco'
      );
    });

    it('deve lançar erro quando resposta não é array', async () => {
      axios.get.mockResolvedValue({ data: {} });

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista')).rejects.toThrow(
        'Nenhum CEP encontrado para este endereco'
      );
    });

    it('deve lançar erro quando API retorna erro HTTP', async () => {
      axios.get.mockRejectedValue({
        response: { status: 400 }
      });

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista')).rejects.toThrow(
        'Erro ao buscar CEP. Tente novamente.'
      );
    });

    it('deve lançar erro quando há erro de conexão', async () => {
      axios.get.mockRejectedValue({
        request: {}
      });

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista')).rejects.toThrow(
        'Erro de conexao com servico de CEP.'
      );
    });

    it('deve relançar erro genérico', async () => {
      const errorMessage = 'Erro de timeout';
      axios.get.mockRejectedValue(new Error(errorMessage));

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista')).rejects.toThrow(errorMessage);
    });

    it('deve mapear corretamente todos os campos da resposta', async () => {
      const mockResponse = {
        data: [
          {
            cep: '22041-001',
            logradouro: 'Avenida Atlântica',
            complemento: 'lado ímpar',
            bairro: 'Copacabana',
            localidade: 'Rio de Janeiro',
            uf: 'RJ',
            ibge: '3304557'
          }
        ]
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await cepService.buscarCEPPorEndereco('RJ', 'Rio de Janeiro', 'Atlantica');

      expect(result[0]).toEqual({
        cep: '22041-001',
        logradouro: 'Avenida Atlântica',
        complemento: 'lado ímpar',
        bairro: 'Copacabana',
        cidade: 'Rio de Janeiro',
        uf: 'RJ',
        ibge: '3304557'
      });
    });
  });
});

