/**
 * Testes para config/api.ts
 */

describe('API Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('deve usar REACT_APP_API_URL quando definido', () => {
    process.env.REACT_APP_API_URL = 'https://custom-api.example.com';
    process.env.NODE_ENV = 'development';
    
    const { API_CONFIG } = require('../api');
    
    expect(API_CONFIG.BASE_URL).toBe('https://custom-api.example.com');
  });

  it('deve usar localhost em desenvolvimento quando REACT_APP_API_URL não definido', () => {
    delete process.env.REACT_APP_API_URL;
    process.env.NODE_ENV = 'development';
    
    const { API_CONFIG } = require('../api');
    
    expect(API_CONFIG.BASE_URL).toBe('http://localhost:3000');
  });

  it('deve ter timeout configurado', () => {
    const { API_CONFIG } = require('../api');
    
    expect(API_CONFIG.TIMEOUT).toBe(10000);
  });

  it('deve logar configuração em desenvolvimento', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    process.env.NODE_ENV = 'development';
    delete process.env.REACT_APP_API_URL;
    
    require('../api');
    
    expect(consoleSpy).toHaveBeenCalledWith('[API CONFIG]', expect.any(Object));
    consoleSpy.mockRestore();
  });

  it('não deve logar configuração em produção', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_API_URL = 'https://api.example.com';
    
    require('../api');
    
    // Verificar que não foi chamado com '[API CONFIG]'
    const calls = consoleSpy.mock.calls.filter(call => call[0] === '[API CONFIG]');
    expect(calls.length).toBe(0);
    consoleSpy.mockRestore();
  });

  it('deve usar URL de produção padrão quando não há REACT_APP_API_URL em produção', () => {
    delete process.env.REACT_APP_API_URL;
    process.env.NODE_ENV = 'production';
    
    const { API_CONFIG } = require('../api');
    
    expect(API_CONFIG.BASE_URL).toBe('https://api.vessel-inspection.com.br');
  });
});
