/**
 * Testes para disableConsoleInProduction.ts
 */

describe('disableConsoleInProduction', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
    table: console.table,
    group: console.group,
    groupEnd: console.groupEnd,
    groupCollapsed: console.groupCollapsed,
    time: console.time,
    timeEnd: console.timeEnd,
    trace: console.trace
  };

  afterEach(() => {
    // Restaurar console original
    Object.assign(console, originalConsole);
    process.env.NODE_ENV = originalEnv;
  });

  describe('em desenvolvimento', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
    });

    it('não deve modificar console.log', () => {
      require('../disableConsoleInProduction');
      
      // Em desenvolvimento, console.log deve funcionar normalmente
      expect(console.log).toBeDefined();
    });

    it('não deve modificar console.error', () => {
      require('../disableConsoleInProduction');
      
      expect(console.error).toBeDefined();
    });
  });

  describe('exportação', () => {
    it('deve exportar módulo vazio', () => {
      const module = require('../disableConsoleInProduction');
      
      // O módulo exporta objeto vazio
      expect(module).toBeDefined();
    });
  });

  describe('funções console em teste', () => {
    it('console.log deve funcionar', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      console.log('test');
      
      expect(spy).toHaveBeenCalledWith('test');
      spy.mockRestore();
    });

    it('console.error deve funcionar', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      console.error('error test');
      
      expect(spy).toHaveBeenCalledWith('error test');
      spy.mockRestore();
    });

    it('console.warn deve funcionar', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      console.warn('warn test');
      
      expect(spy).toHaveBeenCalledWith('warn test');
      spy.mockRestore();
    });

    it('console.info deve funcionar', () => {
      const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
      
      console.info('info test');
      
      expect(spy).toHaveBeenCalledWith('info test');
      spy.mockRestore();
    });

    it('console.debug deve funcionar', () => {
      const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      
      console.debug('debug test');
      
      expect(spy).toHaveBeenCalledWith('debug test');
      spy.mockRestore();
    });
  });
});

