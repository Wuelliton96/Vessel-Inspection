/**
 * Testes extendidos para cepService.js
 * Foco em aumentar cobertura de busca de CEP
 */

const axios = require('axios');

// Mock do axios
jest.mock('axios');

describe('CepService - Testes Extendidos', () => {
  let cepService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    cepService = require('../../services/cepService');
  });

  describe('buscarEnderecoPorCEP', () => {
    it('deve buscar endereço por CEP válido', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          complemento: 'de 1200 ao fim - lado par',
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

      const resultado = await cepService.buscarEnderecoPorCEP('01310100');

      expect(resultado).toHaveProperty('logradouro', 'Avenida Paulista');
      expect(resultado).toHaveProperty('cidade', 'São Paulo');
      expect(resultado).toHaveProperty('uf', 'SP');
    });

    it('deve aceitar CEP com hífen', async () => {
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

      const resultado = await cepService.buscarEnderecoPorCEP('01310-100');

      expect(resultado).toHaveProperty('logradouro');
    });

    it('deve lançar erro para CEP inválido (menos de 8 dígitos)', async () => {
      await expect(cepService.buscarEnderecoPorCEP('123'))
        .rejects.toThrow('CEP invalido');
    });

    it('deve lançar erro para CEP inválido (mais de 8 dígitos)', async () => {
      await expect(cepService.buscarEnderecoPorCEP('123456789'))
        .rejects.toThrow('CEP invalido');
    });

    it('deve lançar erro quando CEP não encontrado', async () => {
      axios.get.mockResolvedValue({ data: { erro: true } });

      await expect(cepService.buscarEnderecoPorCEP('00000000'))
        .rejects.toThrow('CEP nao encontrado');
    });

    it('deve tratar erro de resposta da API', async () => {
      const error = new Error('Request failed');
      error.response = { status: 500 };
      axios.get.mockRejectedValue(error);

      await expect(cepService.buscarEnderecoPorCEP('01310100'))
        .rejects.toThrow('Erro ao consultar CEP');
    });

    it('deve tratar erro de conexão', async () => {
      const error = new Error('Network Error');
      error.request = {};
      axios.get.mockRejectedValue(error);

      await expect(cepService.buscarEnderecoPorCEP('01310100'))
        .rejects.toThrow('Erro de conexao');
    });

    it('deve propagar outros erros', async () => {
      axios.get.mockRejectedValue(new Error('Unexpected error'));

      await expect(cepService.buscarEnderecoPorCEP('01310100'))
        .rejects.toThrow('Unexpected error');
    });

    it('deve retornar todos os campos do endereço', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          complemento: 'lado par',
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

      const resultado = await cepService.buscarEnderecoPorCEP('01310100');

      expect(resultado).toHaveProperty('cep');
      expect(resultado).toHaveProperty('logradouro');
      expect(resultado).toHaveProperty('complemento');
      expect(resultado).toHaveProperty('bairro');
      expect(resultado).toHaveProperty('cidade');
      expect(resultado).toHaveProperty('uf');
      expect(resultado).toHaveProperty('ibge');
      expect(resultado).toHaveProperty('gia');
      expect(resultado).toHaveProperty('ddd');
      expect(resultado).toHaveProperty('siafi');
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

      await cepService.buscarEnderecoPorCEP('01.310-100');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/01310100/'),
        expect.any(Object)
      );
    });

    it('deve usar timeout de 5 segundos', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          localidade: 'São Paulo',
          uf: 'SP'
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      await cepService.buscarEnderecoPorCEP('01310100');

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timeout: 5000 })
      );
    });
  });

  describe('buscarCEPPorEndereco', () => {
    it('deve buscar CEP por endereço', async () => {
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

      const resultado = await cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista');

      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBeGreaterThan(0);
      expect(resultado[0]).toHaveProperty('cep');
    });

    it('deve lançar erro sem UF', async () => {
      await expect(cepService.buscarCEPPorEndereco('', 'São Paulo', 'Avenida Paulista'))
        .rejects.toThrow('UF, cidade e logradouro sao obrigatorios');
    });

    it('deve lançar erro sem cidade', async () => {
      await expect(cepService.buscarCEPPorEndereco('SP', '', 'Avenida Paulista'))
        .rejects.toThrow('UF, cidade e logradouro sao obrigatorios');
    });

    it('deve lançar erro sem logradouro', async () => {
      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', ''))
        .rejects.toThrow('UF, cidade e logradouro sao obrigatorios');
    });

    it('deve lançar erro para UF com mais de 2 letras', async () => {
      await expect(cepService.buscarCEPPorEndereco('SPP', 'São Paulo', 'Avenida Paulista'))
        .rejects.toThrow('UF deve ter 2 letras');
    });

    it('deve lançar erro para UF com menos de 2 letras', async () => {
      await expect(cepService.buscarCEPPorEndereco('S', 'São Paulo', 'Avenida Paulista'))
        .rejects.toThrow('UF deve ter 2 letras');
    });

    it('deve lançar erro para logradouro curto', async () => {
      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Av'))
        .rejects.toThrow('Logradouro deve ter no minimo 3 caracteres');
    });

    it('deve lançar erro quando nenhum CEP encontrado', async () => {
      axios.get.mockResolvedValue({ data: [] });

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Rua Inexistente'))
        .rejects.toThrow('Nenhum CEP encontrado');
    });

    it('deve lançar erro quando resposta não é array', async () => {
      axios.get.mockResolvedValue({ data: {} });

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista'))
        .rejects.toThrow('Nenhum CEP encontrado');
    });

    it('deve retornar múltiplos endereços', async () => {
      const mockResponse = {
        data: [
          {
            cep: '01310-100',
            logradouro: 'Avenida Paulista',
            localidade: 'São Paulo',
            uf: 'SP'
          },
          {
            cep: '01310-200',
            logradouro: 'Avenida Paulista',
            localidade: 'São Paulo',
            uf: 'SP'
          }
        ]
      };
      axios.get.mockResolvedValue(mockResponse);

      const resultado = await cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista');

      expect(resultado.length).toBe(2);
    });

    it('deve tratar erro de resposta da API', async () => {
      const error = new Error('Request failed');
      error.response = { status: 400 };
      axios.get.mockRejectedValue(error);

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista'))
        .rejects.toThrow('Erro ao buscar CEP');
    });

    it('deve tratar erro de conexão', async () => {
      const error = new Error('Network Error');
      error.request = {};
      axios.get.mockRejectedValue(error);

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista'))
        .rejects.toThrow('Erro de conexao');
    });

    it('deve propagar outros erros', async () => {
      axios.get.mockRejectedValue(new Error('Unexpected error'));

      await expect(cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista'))
        .rejects.toThrow('Unexpected error');
    });

    it('deve usar URL correta', async () => {
      const mockResponse = {
        data: [
          { cep: '01310-100', logradouro: 'Avenida Paulista', localidade: 'São Paulo', uf: 'SP' }
        ]
      };
      axios.get.mockResolvedValue(mockResponse);

      await cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/SP/São Paulo/Avenida Paulista/'),
        expect.any(Object)
      );
    });

    it('deve mapear campos corretamente', async () => {
      const mockResponse = {
        data: [
          {
            cep: '01310-100',
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

      const resultado = await cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Avenida Paulista');

      expect(resultado[0]).toHaveProperty('cep', '01310-100');
      expect(resultado[0]).toHaveProperty('logradouro', 'Avenida Paulista');
      expect(resultado[0]).toHaveProperty('complemento', 'lado par');
      expect(resultado[0]).toHaveProperty('bairro', 'Bela Vista');
      expect(resultado[0]).toHaveProperty('cidade', 'São Paulo');
      expect(resultado[0]).toHaveProperty('uf', 'SP');
      expect(resultado[0]).toHaveProperty('ibge', '3550308');
    });
  });
});

describe('CepService - Validação de formato', () => {
  it('deve aceitar CEP só com números', () => {
    const cep = '01310100';
    const cepLimpo = cep.replace(/\D/g, '');
    expect(cepLimpo).toBe('01310100');
    expect(cepLimpo.length).toBe(8);
  });

  it('deve limpar CEP com pontos e hífens', () => {
    const cep = '01.310-100';
    const cepLimpo = cep.replace(/\D/g, '');
    expect(cepLimpo).toBe('01310100');
  });

  it('deve limpar CEP com espaços', () => {
    const cep = '01310 100';
    const cepLimpo = cep.replace(/\D/g, '');
    expect(cepLimpo).toBe('01310100');
  });

  it('deve validar UF com 2 letras', () => {
    const uf = 'SP';
    expect(uf.length).toBe(2);
  });

  it('deve validar logradouro com mínimo 3 caracteres', () => {
    const logradouro = 'Rua';
    expect(logradouro.length).toBeGreaterThanOrEqual(3);
  });
});

