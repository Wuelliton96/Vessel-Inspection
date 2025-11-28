const originalEnv = process.env.NODE_ENV;

describe('Disable Console', () => {
  beforeEach(() => {
    // Restaurar console original antes de cada teste
    delete require.cache[require.resolve('../../utils/disableConsole')];
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    delete require.cache[require.resolve('../../utils/disableConsole')];
  });

  it('deve exportar originalConsole em desenvolvimento', () => {
    process.env.NODE_ENV = 'development';
    const disableConsole = require('../../utils/disableConsole');

    expect(disableConsole.originalConsole).toBeDefined();
    expect(disableConsole.originalConsole).toBe(console);
  });

  it('deve exportar originalConsole em produção', () => {
    process.env.NODE_ENV = 'production';
    const disableConsole = require('../../utils/disableConsole');

    expect(disableConsole.originalConsole).toBeDefined();
    expect(disableConsole.originalConsole).not.toBe(console);
  });

  it('deve exportar isProduction corretamente', () => {
    process.env.NODE_ENV = 'production';
    const disableConsole = require('../../utils/disableConsole');
    expect(disableConsole.isProduction).toBe(true);

    process.env.NODE_ENV = 'development';
    delete require.cache[require.resolve('../../utils/disableConsole')];
    const disableConsole2 = require('../../utils/disableConsole');
    expect(disableConsole2.isProduction).toBe(false);
  });
});

