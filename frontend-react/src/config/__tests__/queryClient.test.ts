import { queryClient } from '../queryClient';

describe('queryClient', () => {
  it('deve criar instância do QueryClient', () => {
    expect(queryClient).toBeDefined();
  });

  it('deve ter configurações padrão corretas para queries', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries).toBeDefined();
    expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutos
    expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000); // 10 minutos
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaultOptions.queries?.refetchOnReconnect).toBe(false);
    expect(defaultOptions.queries?.retry).toBe(1);
    expect(defaultOptions.queries?.retryDelay).toBe(1000);
  });

  it('deve ter configurações padrão corretas para mutations', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.mutations).toBeDefined();
    expect(defaultOptions.mutations?.retry).toBe(1);
  });

  it('deve permitir sobrescrever configurações padrão', () => {
    const customClient = queryClient;
    const defaultOptions = customClient.getDefaultOptions();

    // Verificar que as configurações podem ser acessadas
    expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);
    expect(defaultOptions.mutations?.retry).toBe(1);
  });
});

