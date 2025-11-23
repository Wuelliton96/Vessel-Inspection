// Configuração global para os testes
process.env.NODE_ENV = 'test';

// PROTEÇÃO CRÍTICA: Garantir que TEST_DATABASE_URL está configurado
// Isso previne que testes apaguem dados de produção
if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
  throw new Error(
    'ERRO CRITICO: TEST_DATABASE_URL ou DATABASE_URL deve ser configurada para testes!\n' +
    'Configure TEST_DATABASE_URL com um banco de dados SEPARADO para testes.\n' +
    'NUNCA use o banco de produção em testes!'
  );
}

// Aviso se estiver usando DATABASE_URL em vez de TEST_DATABASE_URL
if (!process.env.TEST_DATABASE_URL && process.env.DATABASE_URL) {
  console.warn(
    'AVISO: Usando DATABASE_URL em vez de TEST_DATABASE_URL.\n' +
    'Recomendado: Configure TEST_DATABASE_URL com um banco de teste separado.'
  );
}

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
