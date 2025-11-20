/**
 * Desabilita console.log, console.error, etc em produção
 * Mantém apenas logs críticos via winston logger
 */

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Salvar referências originais (caso precise para logs críticos)
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  // Função vazia para desabilitar logs
  const noop = () => {};

  // Sobrescrever métodos do console em produção
  console.log = noop;
  console.info = noop;
  console.debug = noop;
  console.warn = noop;
  
  // console.error também desabilitado - usar logger.error para erros críticos
  console.error = noop;
  
  // Desabilitar outros métodos
  console.table = noop;
  console.group = noop;
  console.groupEnd = noop;
  console.groupCollapsed = noop;
  console.time = noop;
  console.timeEnd = noop;
  console.trace = noop;
  console.dir = noop;
  console.dirxml = noop;
  
  // Exportar referências originais caso necessário para casos muito específicos
  module.exports.originalConsole = originalConsole;
} else {
  // Em desenvolvimento, manter console normal
  module.exports.originalConsole = console;
}

module.exports.isProduction = isProduction;

