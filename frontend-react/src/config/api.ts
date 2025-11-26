// Configuracao da API
const getApiBaseUrl = () => {
  // Tentar pegar da variavel de ambiente
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Se estiver em producao, usar a URL de producao
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://api.vessel-inspection.com.br';
  }
  
  // Em desenvolvimento, usar localhost
  return 'http://localhost:3000';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
};

// Log da configuracao ao inicializar (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('[API CONFIG]', {
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    environment: process.env.NODE_ENV || 'development'
  });
}


