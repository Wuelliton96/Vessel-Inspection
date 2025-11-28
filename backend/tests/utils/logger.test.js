const winston = require('winston');
const logger = require('../../utils/logger');

describe('Logger', () => {
  it('deve ser uma instância do winston logger', () => {
    expect(logger).toBeInstanceOf(winston.Logger);
  });

  it('deve ter métodos de log', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  it('deve poder logar mensagens', () => {
    expect(() => {
      logger.info('Test info message');
      logger.warn('Test warn message');
      logger.error('Test error message');
    }).not.toThrow();
  });

  it('deve ter configuração de transports', () => {
    expect(logger.transports).toBeDefined();
    expect(Array.isArray(logger.transports)).toBe(true);
  });
});

