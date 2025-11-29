const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('CEP Service', () => {
  let cepService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    cepService = require('../../services/cepService');
  });

  describe('buscarEnderecoPorCEP', () => {
    it('deve retornar endereço para CEP válido', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP',
          complemento: '',
          ibge: '3550308'
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const resultado = await cepService.buscarEnderecoPorCEP('01310100');

      expect(resultado).toBeDefined();
      expect(resultado.logradouro).toBe('Avenida Paulista');
      expect(resultado.localidade).toBe('São Paulo');
      expect(resultado.uf).toBe('SP');
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

      axios.get.mockResolvedValueOnce(mockResponse);

      const resultado = await cepService.buscarEnderecoPorCEP('01310-100');

      expect(resultado).toBeDefined();
      expect(resultado.logradouro).toBe('Avenida Paulista');
    });

    it('deve retornar erro para CEP não encontrado', async () => {
      const mockResponse = {
        data: {
          erro: true
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      await expect(cepService.buscarEnderecoPorCEP('00000000')).rejects.toThrow();
    });

    it('deve lançar erro para CEP inválido (menos de 8 dígitos)', async () => {
      await expect(cepService.buscarEnderecoPorCEP('1234')).rejects.toThrow();
    });

    it('deve lançar erro para CEP vazio', async () => {
      await expect(cepService.buscarEnderecoPorCEP('')).rejects.toThrow();
    });

    it('deve lançar erro para CEP null', async () => {
      await expect(cepService.buscarEnderecoPorCEP(null)).rejects.toThrow();
    });

    it('deve lançar erro para CEP undefined', async () => {
      await expect(cepService.buscarEnderecoPorCEP(undefined)).rejects.toThrow();
    });

    it('deve tratar erro de rede', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(cepService.buscarEnderecoPorCEP('01310100')).rejects.toThrow();
    });

    it('deve tratar timeout', async () => {
      axios.get.mockRejectedValueOnce(new Error('timeout'));

      await expect(cepService.buscarEnderecoPorCEP('01310100')).rejects.toThrow();
    });

    it('deve limpar caracteres especiais do CEP', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP'
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const resultado = await cepService.buscarEnderecoPorCEP('01.310-100');

      expect(resultado).toBeDefined();
      // Verifica que a chamada foi feita com CEP limpo
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('01310100'),
        expect.any(Object)
      );
    });

    it('deve retornar todos os campos do endereço', async () => {
      const mockResponse = {
        data: {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          complemento: 'Lado ímpar',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP',
          ibge: '3550308',
          ddd: '11'
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const resultado = await cepService.buscarEnderecoPorCEP('01310100');

      expect(resultado.cep).toBe('01310-100');
      expect(resultado.logradouro).toBe('Avenida Paulista');
      expect(resultado.complemento).toBe('Lado ímpar');
      expect(resultado.bairro).toBe('Bela Vista');
      expect(resultado.localidade).toBe('São Paulo');
      expect(resultado.uf).toBe('SP');
    });
  });

  describe('buscarCEPPorEndereco', () => {
    it('deve retornar CEPs para endereço válido', async () => {
      const mockResponse = {
        data: [
          {
            cep: '01310-100',
            logradouro: 'Avenida Paulista',
            bairro: 'Bela Vista',
            localidade: 'São Paulo',
            uf: 'SP'
          },
          {
            cep: '01310-200',
            logradouro: 'Avenida Paulista',
            bairro: 'Cerqueira César',
            localidade: 'São Paulo',
            uf: 'SP'
          }
        ]
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const resultado = await cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista');

      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBeGreaterThan(0);
    });

    it('deve lançar erro para UF inválida', async () => {
      await expect(
        cepService.buscarCEPPorEndereco('', 'São Paulo', 'Paulista')
      ).rejects.toThrow();
    });

    it('deve lançar erro para cidade vazia', async () => {
      await expect(
        cepService.buscarCEPPorEndereco('SP', '', 'Paulista')
      ).rejects.toThrow();
    });

    it('deve lançar erro para logradouro vazio', async () => {
      await expect(
        cepService.buscarCEPPorEndereco('SP', 'São Paulo', '')
      ).rejects.toThrow();
    });

    it('deve tratar endereço não encontrado', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });

      const resultado = await cepService.buscarCEPPorEndereco('SP', 'Cidade', 'Rua');

      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBe(0);
    });

    it('deve codificar caracteres especiais na URL', async () => {
      const mockResponse = {
        data: [{
          cep: '01310-100',
          logradouro: 'Avenida São João',
          localidade: 'São Paulo',
          uf: 'SP'
        }]
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      await cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'São João');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('S%C3%A3o'),
        expect.any(Object)
      );
    });

    it('deve tratar erro de rede na busca por endereço', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(
        cepService.buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista')
      ).rejects.toThrow();
    });
  });

  describe('Validação de CEP', () => {
    it('deve aceitar CEP com exatamente 8 dígitos', async () => {
      const mockResponse = {
        data: {
          cep: '12345-678',
          logradouro: 'Rua Test',
          localidade: 'Cidade',
          uf: 'SP'
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const resultado = await cepService.buscarEnderecoPorCEP('12345678');
      expect(resultado).toBeDefined();
    });

    it('deve rejeitar CEP com mais de 8 dígitos', async () => {
      await expect(
        cepService.buscarEnderecoPorCEP('123456789')
      ).rejects.toThrow();
    });

    it('deve rejeitar CEP com letras', async () => {
      await expect(
        cepService.buscarEnderecoPorCEP('1234567A')
      ).rejects.toThrow();
    });
  });

  describe('Formatação de resposta', () => {
    it('deve manter formato original do ViaCEP', async () => {
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

      axios.get.mockResolvedValueOnce(mockResponse);

      const resultado = await cepService.buscarEnderecoPorCEP('01310100');

      // Verificar que campos extras são mantidos
      expect(resultado.ibge).toBe('3550308');
    });
  });

  describe('Tratamento de erros HTTP', () => {
    it('deve tratar erro 400 do ViaCEP', async () => {
      const error = new Error('Bad Request');
      error.response = { status: 400 };
      axios.get.mockRejectedValueOnce(error);

      await expect(
        cepService.buscarEnderecoPorCEP('01310100')
      ).rejects.toThrow();
    });

    it('deve tratar erro 500 do ViaCEP', async () => {
      const error = new Error('Internal Server Error');
      error.response = { status: 500 };
      axios.get.mockRejectedValueOnce(error);

      await expect(
        cepService.buscarEnderecoPorCEP('01310100')
      ).rejects.toThrow();
    });
  });
});
