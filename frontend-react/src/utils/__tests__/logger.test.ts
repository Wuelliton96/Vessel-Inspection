import { logger } from '../logger';

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
  const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('em desenvolvimento', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
    });

    it('deve logar em desenvolvimento', () => {
      const { logger: devLogger } = require('../logger');
      devLogger.log('test');
      expect(consoleLogSpy).toHaveBeenCalledWith('test');
    });

    it('deve logar erros em desenvolvimento', () => {
      const { logger: devLogger } = require('../logger');
      devLogger.error('error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('error');
    });
  });

  describe('em produção', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
    });

    it('não deve logar em produção', () => {
      const { logger: prodLogger } = require('../logger');
      prodLogger.log('test');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('não deve logar erros em produção', () => {
      const { logger: prodLogger } = require('../logger');
      prodLogger.error('error');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});


