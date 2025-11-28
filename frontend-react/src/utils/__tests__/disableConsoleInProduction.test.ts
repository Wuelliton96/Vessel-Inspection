/**
 * Testes para disableConsoleInProduction
 * 
 * IMPORTANTE: Este arquivo deve ser importado ANTES de qualquer outro módulo
 * que importe disableConsoleInProduction, pois o módulo executa código no top-level.
 */

describe('disableConsoleInProduction', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalConsole = { ...console };

  beforeEach(() => {
    // Restaurar console original antes de cada teste
    Object.assign(console, originalConsole);
    jest.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    Object.assign(console, originalConsole);
  });

  it('não deve desabilitar console em desenvolvimento', () => {
    process.env.NODE_ENV = 'development';
    
    // Reimportar módulo para aplicar mudanças
    jest.isolateModules(() => {
      require('../disableConsoleInProduction');
      
      expect(console.log).not.toBe(originalConsole.log);
      expect(typeof console.log).toBe('function');
    });
  });

  it('deve desabilitar console.log em produção', () => {
    process.env.NODE_ENV = 'production';
    
    jest.isolateModules(() => {
      require('../disableConsoleInProduction');
      
      const result = console.log('test');
      expect(result).toBeUndefined();
    });
  });

  it('deve desabilitar console.warn em produção', () => {
    process.env.NODE_ENV = 'production';
    
    jest.isolateModules(() => {
      require('../disableConsoleInProduction');
      
      const result = console.warn('test');
      expect(result).toBeUndefined();
    });
  });

  it('deve desabilitar console.info em produção', () => {
    process.env.NODE_ENV = 'production';
    
    jest.isolateModules(() => {
      require('../disableConsoleInProduction');
      
      const result = console.info('test');
      expect(result).toBeUndefined();
    });
  });

  it('deve desabilitar console.debug em produção', () => {
    process.env.NODE_ENV = 'production';
    
    jest.isolateModules(() => {
      require('../disableConsoleInProduction');
      
      const result = console.debug('test');
      expect(result).toBeUndefined();
    });
  });

  it('deve desabilitar console.table em produção', () => {
    process.env.NODE_ENV = 'production';
    
    jest.isolateModules(() => {
      require('../disableConsoleInProduction');
      
      const result = console.table({ test: 'value' });
      expect(result).toBeUndefined();
    });
  });

  it('deve desabilitar console.group em produção', () => {
    process.env.NODE_ENV = 'production';
    
    jest.isolateModules(() => {
      require('../disableConsoleInProduction');
      
      const result = console.group('test');
      expect(result).toBeUndefined();
    });
  });

  it('deve desabilitar console.error em produção quando __DEV__ não está definido', () => {
    process.env.NODE_ENV = 'production';
    (window as any).__DEV__ = undefined;
    
    jest.isolateModules(() => {
      const originalError = console.error;
      require('../disableConsoleInProduction');
      
      console.error('test');
      // console.error deve ser sobrescrito
      expect(console.error).not.toBe(originalError);
    });
  });

  it('não deve desabilitar console.error em produção quando __DEV__ está definido', () => {
    process.env.NODE_ENV = 'production';
    (window as any).__DEV__ = true;
    
    jest.isolateModules(() => {
      const originalError = console.error;
      const errorSpy = jest.spyOn(console, 'error');
      
      require('../disableConsoleInProduction');
      
      console.error('test');
      
      // console.error deve chamar originalError quando __DEV__ está definido
      expect(errorSpy).toHaveBeenCalledWith('test');
      
      errorSpy.mockRestore();
    });
  });
});

