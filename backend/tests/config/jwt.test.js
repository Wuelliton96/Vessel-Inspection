const { getJwtSecret, getJwtExpiration } = require('../../config/jwt');
const logger = require('../../utils/logger');

jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn()
}));

describe('JWT Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getJwtSecret', () => {
    it('deve retornar JWT_SECRET quando configurado', () => {
      process.env.JWT_SECRET = 'test-secret-key-12345678901234567890';
      const secret = getJwtSecret();
      expect(secret).toBe('test-secret-key-12345678901234567890');
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('deve lançar erro em produção sem JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      expect(() => getJwtSecret()).toThrow('JWT_SECRET não configurado');
      expect(logger.error).toHaveBeenCalledWith('JWT_SECRET não configurado em produção!');
    });

    it('deve usar fallback em desenvolvimento sem JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'development';

      const secret = getJwtSecret();
      expect(secret).toBe('dev-secret-key-not-for-production');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('deve usar fallback em teste sem JWT_SECRET', () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'test';

      const secret = getJwtSecret();
      expect(secret).toBe('dev-secret-key-not-for-production');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('deve avisar se JWT_SECRET for muito curto', () => {
      process.env.JWT_SECRET = 'short';
      process.env.NODE_ENV = 'development';

      getJwtSecret();
      expect(logger.warn).toHaveBeenCalledWith('JWT_SECRET muito curto. Recomenda-se pelo menos 32 caracteres.');
    });
  });

  describe('getJwtExpiration', () => {
    it('deve retornar JWT_EXPIRATION quando configurado', () => {
      process.env.JWT_EXPIRATION = '1h';
      const expiration = getJwtExpiration();
      expect(expiration).toBe('1h');
    });

    it('deve retornar padrão 24h quando não configurado', () => {
      delete process.env.JWT_EXPIRATION;
      const expiration = getJwtExpiration();
      expect(expiration).toBe('24h');
    });
  });
});

