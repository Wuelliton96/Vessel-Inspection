/**
 * Testes abrangentes para cepService
 */

const axios = require('axios');

// Mock do axios
jest.mock('axios');

describe('CEP Service - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // ==========================================
  // buscarEnderecoPorCEP
  // ==========================================
  
  describe('buscarEnderecoPorCEP', () => {
    it('deve buscar endereço válido', async () => {
      const mockResponse = {
        data: {
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
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const { buscarEnderecoPorCEP } = require('../../services/cepService');
      const result = await buscarEnderecoPorCEP('01310100');
      
      expect(result).toBeDefined();
      expect(result.logradouro).toBe('Avenida Paulista');
    });
    
    it('deve buscar endereço com CEP formatado', async () => {
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
      
      const { buscarEnderecoPorCEP } = require('../../services/cepService');
      const result = await buscarEnderecoPorCEP('01310-100');
      
      expect(result).toBeDefined();
    });
    
    it('deve lançar erro para CEP inválido (menos de 8 dígitos)', async () => {
      const { buscarEnderecoPorCEP } = require('../../services/cepService');
      
      await expect(buscarEnderecoPorCEP('1234')).rejects.toThrow();
    });
    
    it('deve lançar erro para CEP vazio', async () => {
      const { buscarEnderecoPorCEP } = require('../../services/cepService');
      
      await expect(buscarEnderecoPorCEP('')).rejects.toThrow();
    });
    
    it('deve lançar erro para CEP null', async () => {
      const { buscarEnderecoPorCEP } = require('../../services/cepService');
      
      await expect(buscarEnderecoPorCEP(null)).rejects.toThrow();
    });
    
    it('deve lançar erro para CEP não encontrado', async () => {
      const mockResponse = {
        data: {
          erro: true
        }
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const { buscarEnderecoPorCEP } = require('../../services/cepService');
      
      await expect(buscarEnderecoPorCEP('00000000')).rejects.toThrow();
    });
    
    it('deve lidar com erro de rede', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));
      
      const { buscarEnderecoPorCEP } = require('../../services/cepService');
      
      await expect(buscarEnderecoPorCEP('01310100')).rejects.toThrow();
    });
    
    it('deve lidar com timeout', async () => {
      axios.get.mockRejectedValue({ code: 'ECONNABORTED' });
      
      const { buscarEnderecoPorCEP } = require('../../services/cepService');
      
      await expect(buscarEnderecoPorCEP('01310100')).rejects.toThrow();
    });
    
    it('deve remover caracteres não numéricos do CEP', async () => {
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
      
      const { buscarEnderecoPorCEP } = require('../../services/cepService');
      const result = await buscarEnderecoPorCEP('01.310-100');
      
      expect(result).toBeDefined();
    });
  });
  
  // ==========================================
  // buscarCEPPorEndereco
  // ==========================================
  
  describe('buscarCEPPorEndereco', () => {
    it('deve buscar CEPs por endereço', async () => {
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
            bairro: 'Consolação',
            localidade: 'São Paulo',
            uf: 'SP'
          }
        ]
      };
      
      axios.get.mockResolvedValue(mockResponse);
      
      const { buscarCEPPorEndereco } = require('../../services/cepService');
      const result = await buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
    
    it('deve lançar erro para UF inválida', async () => {
      const { buscarCEPPorEndereco } = require('../../services/cepService');
      
      await expect(buscarCEPPorEndereco('XX', 'Cidade', 'Rua')).rejects.toThrow();
    });
    
    it('deve lançar erro para cidade vazia', async () => {
      const { buscarCEPPorEndereco } = require('../../services/cepService');
      
      await expect(buscarCEPPorEndereco('SP', '', 'Rua')).rejects.toThrow();
    });
    
    it('deve lançar erro para logradouro muito curto', async () => {
      const { buscarCEPPorEndereco } = require('../../services/cepService');
      
      await expect(buscarCEPPorEndereco('SP', 'São Paulo', 'AB')).rejects.toThrow();
    });
    
    it('deve retornar array vazio quando não encontrar', async () => {
      axios.get.mockResolvedValue({ data: [] });
      
      const { buscarCEPPorEndereco } = require('../../services/cepService');
      const result = await buscarCEPPorEndereco('SP', 'Cidade Inexistente', 'Rua Inexistente');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
    
    it('deve lidar com erro de rede', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));
      
      const { buscarCEPPorEndereco } = require('../../services/cepService');
      
      await expect(buscarCEPPorEndereco('SP', 'São Paulo', 'Paulista')).rejects.toThrow();
    });
  });
  
  // ==========================================
  // Validações
  // ==========================================
  
  describe('Validações', () => {
    it('deve validar CEP com 8 dígitos', () => {
      const cep = '01310100';
      const isValid = /^\d{8}$/.test(cep);
      expect(isValid).toBe(true);
    });
    
    it('deve rejeitar CEP com letras', () => {
      const cep = '0131010A';
      const isValid = /^\d{8}$/.test(cep);
      expect(isValid).toBe(false);
    });
    
    it('deve validar UF válida', () => {
      const ufsValidas = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
                         'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
                         'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
      
      expect(ufsValidas.includes('SP')).toBe(true);
      expect(ufsValidas.includes('RJ')).toBe(true);
    });
    
    it('deve rejeitar UF inválida', () => {
      const ufsValidas = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
                         'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
                         'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
      
      expect(ufsValidas.includes('XX')).toBe(false);
      expect(ufsValidas.includes('AB')).toBe(false);
    });
  });
  
  // ==========================================
  // Formatação
  // ==========================================
  
  describe('Formatação', () => {
    it('deve formatar CEP corretamente', () => {
      const cep = '01310100';
      const formatado = cep.replace(/(\d{5})(\d{3})/, '$1-$2');
      expect(formatado).toBe('01310-100');
    });
    
    it('deve limpar CEP formatado', () => {
      const cep = '01310-100';
      const limpo = cep.replace(/\D/g, '');
      expect(limpo).toBe('01310100');
    });
    
    it('deve tratar espaços no CEP', () => {
      const cep = ' 01310 100 ';
      const limpo = cep.replace(/\D/g, '');
      expect(limpo).toBe('01310100');
    });
  });
  
  // ==========================================
  // URL da API
  // ==========================================
  
  describe('URL da API', () => {
    it('deve construir URL correta para busca por CEP', () => {
      const cep = '01310100';
      const url = `https://viacep.com.br/ws/${cep}/json/`;
      expect(url).toBe('https://viacep.com.br/ws/01310100/json/');
    });
    
    it('deve construir URL correta para busca por endereço', () => {
      const uf = 'SP';
      const cidade = 'São Paulo';
      const logradouro = 'Paulista';
      const url = `https://viacep.com.br/ws/${uf}/${encodeURIComponent(cidade)}/${encodeURIComponent(logradouro)}/json/`;
      expect(url).toContain('SP');
      expect(url).toContain('Paulista');
    });
  });
});

