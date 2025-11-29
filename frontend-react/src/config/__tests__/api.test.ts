import { API_CONFIG } from '../api';

describe('API Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('deve usar REACT_APP_API_URL se definido', () => {
    process.env.REACT_APP_API_URL = 'https://custom-api.com';
    delete process.env.NODE_ENV;
    
    jest.resetModules();
    const { API_CONFIG: config } = require('../api');
    
    expect(config.BASE_URL).toBe('https://custom-api.com');
  });

  it('deve usar localhost em desenvolvimento', () => {
    delete process.env.REACT_APP_API_URL;
    process.env.NODE_ENV = 'development';
    
    jest.resetModules();
    const { API_CONFIG: config } = require('../api');
    
    expect(config.BASE_URL).toBe('http://localhost:3000');
  });

  it('deve ter TIMEOUT configurado', () => {
    expect(API_CONFIG.TIMEOUT).toBe(10000);
  });
});


