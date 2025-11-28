const logger = require('../../utils/logger');
const winston = require('winston');

describe('Logger Utils', () => {
  it('deve exportar instância do logger', () => {
    expect(logger).toBeDefined();
    expect(logger).toBeInstanceOf(winston.Logger);
  });

  it('deve ter método info', () => {
    expect(typeof logger.info).toBe('function');
  });

  it('deve ter método error', () => {
    expect(typeof logger.error).toBe('function');
  });

  it('deve ter método warn', () => {
    expect(typeof logger.warn).toBe('function');
  });

  it('deve ter método debug', () => {
    expect(typeof logger.debug).toBe('function');
  });

  it('deve logar mensagem de info', () => {
    expect(() => logger.info('Test info message')).not.toThrow();
  });

  it('deve logar mensagem de erro', () => {
    expect(() => logger.error('Test error message')).not.toThrow();
  });

  it('deve logar mensagem de warning', () => {
    expect(() => logger.warn('Test warning message')).not.toThrow();
  });

  it('deve logar mensagem de debug', () => {
    expect(() => logger.debug('Test debug message')).not.toThrow();
  });

  it('deve logar objeto com informações', () => {
    expect(() => logger.info('Test', { key: 'value' })).not.toThrow();
  });

  it('deve logar erro com stack trace', () => {
    const error = new Error('Test error');
    expect(() => logger.error('Error occurred', error)).not.toThrow();
  });
});
