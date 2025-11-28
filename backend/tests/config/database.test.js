const logger = require('../../utils/logger');

jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Database Config', () => {
  const originalEnv = process.env;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('deve usar TEST_DATABASE_URL em ambiente de teste', () => {
    process.env.NODE_ENV = 'test';
    process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    process.env.DATABASE_URL = 'postgresql://prod:prod@localhost:5432/prod_db';

    const sequelize = require('../../config/database');
    
    expect(sequelize).toBeDefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('AMBIENTE DE TESTE: Usando TEST_DATABASE_URL')
    );
  });

  it('deve usar DATABASE_URL como fallback em teste se TEST_DATABASE_URL não existir', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.TEST_DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

    const sequelize = require('../../config/database');
    
    expect(sequelize).toBeDefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('AMBIENTE DE TESTE: Usando DATABASE_URL')
    );
  });

  it('deve lançar erro se nenhuma URL estiver configurada em teste', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.TEST_DATABASE_URL;
    delete process.env.DATABASE_URL;

    expect(() => {
      require('../../config/database');
    }).toThrow('TEST_DATABASE_URL ou DATABASE_URL deve ser definida');
  });

  it('deve alertar se URL parecer ser de produção em teste', () => {
    process.env.NODE_ENV = 'test';
    process.env.TEST_DATABASE_URL = 'postgresql://user:pass@prod.example.com:5432/production_db';

    require('../../config/database');
    
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('ALERTA DE SEGURANCA')
    );
  });

  it('deve usar DATABASE_URL em produção', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://prod:prod@localhost:5432/prod_db';

    const sequelize = require('../../config/database');
    
    expect(sequelize).toBeDefined();
  });

  it('deve lançar erro se DATABASE_URL não estiver configurada em produção', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;

    expect(() => {
      require('../../config/database');
    }).toThrow('DATABASE_URL não definida');
  });

  it('deve configurar SSL para URLs de produção', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://user:pass@amazonaws.com:5432/db';

    const sequelize = require('../../config/database');
    
    expect(sequelize).toBeDefined();
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Using SSL')
    );
  });

  it('não deve usar SSL para localhost', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.DB_SSL = 'true';

    const sequelize = require('../../config/database');
    
    expect(sequelize).toBeDefined();
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Is localhost = true')
    );
  });
});

