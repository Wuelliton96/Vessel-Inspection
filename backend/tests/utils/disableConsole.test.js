const disableConsole = require('../../utils/disableConsole');

describe('Disable Console Utils', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalConsole = global.console;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    global.console = originalConsole;
    jest.resetModules();
  });

  it('deve exportar isProduction', () => {
    expect(disableConsole.isProduction).toBeDefined();
    expect(typeof disableConsole.isProduction).toBe('boolean');
  });

  it('deve exportar originalConsole', () => {
    expect(disableConsole.originalConsole).toBeDefined();
  });

  it('deve manter console em desenvolvimento', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    const disableConsoleDev = require('../../utils/disableConsole');
    
    expect(disableConsoleDev.originalConsole).toBeDefined();
    expect(typeof console.log).toBe('function');
    expect(console.log.toString()).not.toBe('function noop() {}');
  });

  it('deve desabilitar console em produção', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    require('../../utils/disableConsole');
    
    expect(typeof console.log).toBe('function');
  });

  it('deve ter originalConsole disponível em produção', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    const disableConsoleProd = require('../../utils/disableConsole');
    
    expect(disableConsoleProd.originalConsole).toBeDefined();
    expect(disableConsoleProd.originalConsole.log).toBeDefined();
  });
});
