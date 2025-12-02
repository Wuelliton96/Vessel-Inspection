/**
 * Testes unitários para cepService
 * Usa mocks para evitar chamadas externas
 */
const axios = require('axios');

jest.mock('axios');

describe('cepService - Testes Unitários', () => {
  let cepService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.resetModules();
    cepService = require('../../services/cepService');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('buscarEnderecoPorCEP - Casos de sucesso', () => {
    const mockEndereco = {
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      complemento: 'até 610 - lado par',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
      ibge: '3550308',
      gia: '1004',
      ddd: '11',
      siafi: '7107'
    };

    it('deve retornar endereco formatado corretamente', async () => {
      axios.get.mockResolvedValue({ data: mockEndereco });

      const result = await cepService.buscarEnderecoPorCEP('01310100');

      expect(result).toEqual({
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        complemento: 'até 610 - lado par',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
        ibge: '3550308',
        gia: '1004',
        ddd: '11',
        siafi: '7107'
      });
    });

    it('deve limpar CEP com pontos e traços', async () => {
      axios.get.mockResolvedValue({ data: mockEndereco });

      await cepService.buscarEnderecoPorCEP('01.310-100');

      expect(axios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/01310100/json/',
        { timeout: 5000 }
      );
    });

    it('deve limpar CEP com espaços', async () => {
      axios.get.mockResolvedValue({ data: mockEndereco });

      await cepService.buscarEnderecoPorCEP(' 01310 100 ');

      expect(axios.get).toHaveBeenCalledWith(
        'https://viacep.com.br/ws/01310100/json/',
        { timeout: 5000 }
      );
    });
  });

  describe('buscarEnderecoPorCEP - Validações', () => {
    it('deve rejeitar CEP com 7 dígitos', async () => {
      await expect(cepService.buscarEnderecoPorCEP('1234567'))
        .rejects.toThrow('CEP invalido');
    });

    it('deve rejeitar CEP com 9 dígitos', async () => {
      await expect(cepService.buscarEnderecoPorCEP('123456789'))
        .rejects.toThrow('CEP invalido');
    });

    it('deve rejeitar CEP com letras', async () => {
      await expect(cepService.buscarEnderecoPorCEP('0131A100'))
        .rejects.toThrow('CEP invalido');
    });

    it('deve rejeitar CEP nulo', async () => {
      await expect(cepService.buscarEnderecoPorCEP(null))
        .rejects.toThrow();
    });
  });

  describe('buscarEnderecoPorCEP - Erros de API', () => {
    it('deve tratar erro 400 da API', async () => {
      axios.get.mockRejectedValue({ response: { status: 400 } });

      await expect(cepService.buscarEnderecoPorCEP('01310100'))
        .rejects.toThrow('Erro ao consultar CEP');
    });

    it('deve tratar erro 500 da API', async () => {
      axios.get.mockRejectedValue({ response: { status: 500 } });

      await expect(cepService.buscarEnderecoPorCEP('01310100'))
        .rejects.toThrow('Erro ao consultar CEP');
    });

    it('deve tratar timeout', async () => {
      axios.get.mockRejectedValue({ request: {}, code: 'ECONNABORTED' });

      await expect(cepService.buscarEnderecoPorCEP('01310100'))
        .rejects.toThrow('Erro de conexao');
    });

    it('deve tratar erro de rede', async () => {
      axios.get.mockRejectedValue({ request: {}, code: 'ENOTFOUND' });

      await expect(cepService.buscarEnderecoPorCEP('01310100'))
        .rejects.toThrow('Erro de conexao');
    });

    it('deve tratar CEP inexistente (erro: true)', async () => {
      axios.get.mockResolvedValue({ data: { erro: true } });

      await expect(cepService.buscarEnderecoPorCEP('99999999'))
        .rejects.toThrow('CEP nao encontrado');
    });
  });

  describe('buscarCEPPorEndereco - Casos de sucesso', () => {
    const mockResultados = [
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
    ];

    it('deve retornar lista de endereços', async () => {
      axios.get.mockResolvedValue({ data: mockResultados });

      const result = await cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista');

      expect(result).toHaveLength(2);
      expect(result[0].cidade).toBe('São Paulo');
    });

    it('deve mapear localidade para cidade', async () => {
      axios.get.mockResolvedValue({ data: mockResultados });

      const result = await cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista');

      expect(result[0]).not.toHaveProperty('localidade');
      expect(result[0]).toHaveProperty('cidade');
    });
  });

  describe('buscarCEPPorEndereco - Validações', () => {
    it('deve rejeitar sem UF', async () => {
      await expect(cepService.buscarCEPPorEndereco(null, 'São Paulo', 'Paulista'))
        .rejects.toThrow('obrigatorios');
    });

    it('deve rejeitar sem cidade', async () => {
      await expect(cepService.buscarCEPPorEndereco('SP', null, 'Paulista'))
        .rejects.toThrow('obrigatorios');
    });

    it('deve rejeitar sem logradouro', async () => {
      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', null))
        .rejects.toThrow('obrigatorios');
    });

    it('deve rejeitar UF com 1 caractere', async () => {
      await expect(cepService.buscarCEPPorEndereco('S', 'São Paulo', 'Paulista'))
        .rejects.toThrow('UF deve ter 2 letras');
    });

    it('deve rejeitar UF com 3 caracteres', async () => {
      await expect(cepService.buscarCEPPorEndereco('SPP', 'São Paulo', 'Paulista'))
        .rejects.toThrow('UF deve ter 2 letras');
    });

    it('deve rejeitar logradouro com 1 caractere', async () => {
      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'P'))
        .rejects.toThrow('minimo 3 caracteres');
    });

    it('deve rejeitar logradouro com 2 caracteres', async () => {
      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Pa'))
        .rejects.toThrow('minimo 3 caracteres');
    });
  });

  describe('buscarCEPPorEndereco - Erros', () => {
    it('deve tratar resposta vazia', async () => {
      axios.get.mockResolvedValue({ data: [] });

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Rua Inexistente'))
        .rejects.toThrow('Nenhum CEP encontrado');
    });

    it('deve tratar resposta não-array', async () => {
      axios.get.mockResolvedValue({ data: null });

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista'))
        .rejects.toThrow('Nenhum CEP encontrado');
    });

    it('deve tratar erro de conexão', async () => {
      axios.get.mockRejectedValue({ request: {} });

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista'))
        .rejects.toThrow('Erro de conexao');
    });

    it('deve tratar erro HTTP', async () => {
      axios.get.mockRejectedValue({ response: { status: 400 } });

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista'))
        .rejects.toThrow('Erro ao buscar CEP');
    });
  });
});



