import { QueryClient } from '@tanstack/react-query';

// Configuração do React Query para cache de requisições
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tempo que os dados são considerados "frescos" (não faz nova requisição)
      staleTime: 5 * 60 * 1000, // 5 minutos
      
      // Tempo que os dados ficam em cache após não serem usados
      gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
      
      // Não recarregar automaticamente ao focar na janela
      refetchOnWindowFocus: false,
      
      // Não recarregar ao reconectar
      refetchOnReconnect: false,
      
      // Retry automático em caso de erro
      retry: 1,
      
      // Tempo de retry
      retryDelay: 1000,
    },
    mutations: {
      // Retry em mutações
      retry: 1,
    },
  },
});

