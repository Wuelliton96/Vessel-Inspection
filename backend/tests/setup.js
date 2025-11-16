// Configuração global para os testes
process.env.NODE_ENV = 'test';

// Configurar timeout para operações de banco de dados
jest.setTimeout(30000);

// Mock do console para reduzir ruído nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: (...args) => {
    // Mostrar apenas erros reais
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Error:')) {
      console.error(...args);
    }
  },
};
