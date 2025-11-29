/**
 * Testes para logger.ts
 */

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });
  
  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('em ambiente de desenvolvimento', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(console, 'info').mockImplementation(() => {});
      jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('deve chamar console.log em desenvolvimento', () => {
      const { logger } = require('../logger');
      logger.log('test message');
      expect(console.log).toHaveBeenCalledWith('test message');
    });

    it('deve chamar console.error em desenvolvimento', () => {
      const { logger } = require('../logger');
      logger.error('error message');
      expect(console.error).toHaveBeenCalledWith('error message');
    });

    it('deve chamar console.warn em desenvolvimento', () => {
      const { logger } = require('../logger');
      logger.warn('warn message');
      expect(console.warn).toHaveBeenCalledWith('warn message');
    });

    it('deve chamar console.info em desenvolvimento', () => {
      const { logger } = require('../logger');
      logger.info('info message');
      expect(console.info).toHaveBeenCalledWith('info message');
    });

    it('deve chamar console.debug em desenvolvimento', () => {
      const { logger } = require('../logger');
      logger.debug('debug message');
      expect(console.debug).toHaveBeenCalledWith('debug message');
    });

    it('deve passar múltiplos argumentos', () => {
      const { logger } = require('../logger');
      logger.log('message', { data: 'test' }, 123);
      expect(console.log).toHaveBeenCalledWith('message', { data: 'test' }, 123);
    });
  });

  describe('em ambiente de produção', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(console, 'info').mockImplementation(() => {});
      jest.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('não deve chamar console.log em produção', () => {
      const { logger } = require('../logger');
      logger.log('test message');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('não deve chamar console.error em produção', () => {
      const { logger } = require('../logger');
      logger.error('error message');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('não deve chamar console.warn em produção', () => {
      const { logger } = require('../logger');
      logger.warn('warn message');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('não deve chamar console.info em produção', () => {
      const { logger } = require('../logger');
      logger.info('info message');
      expect(console.info).not.toHaveBeenCalled();
    });

    it('não deve chamar console.debug em produção', () => {
      const { logger } = require('../logger');
      logger.debug('debug message');
      expect(console.debug).not.toHaveBeenCalled();
    });
  });
});
