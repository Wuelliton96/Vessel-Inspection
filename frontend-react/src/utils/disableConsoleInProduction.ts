/**
 * Desabilita todos os logs do console em produção
 * Isso garante que nenhuma informação sensível seja exposta aos usuários
 */

if (process.env.NODE_ENV === 'production') {
  // Sobrescrever console.log, console.error, console.warn, console.info, console.debug
  const noop = () => {};
  
  // Manter apenas console.error para erros críticos, mas sem detalhes
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Em produção, não exibir erros no console
    // Apenas registrar silenciosamente se necessário
    if (typeof window !== 'undefined' && (window as any).__DEV__) {
      originalError.apply(console, args);
    }
  };
  
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  
  // Desabilitar também console.table, console.group, etc
  console.table = noop;
  console.group = noop;
  console.groupEnd = noop;
  console.groupCollapsed = noop;
  console.time = noop;
  console.timeEnd = noop;
  console.trace = noop;
}

// Export vazio para tornar este arquivo um módulo (necessário para --isolatedModules)
export {};

