import { API_CONFIG } from '../config/api';

// Utilitário para testar conexão com o backend
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    console.log('Testando conexão com backend...');
    const response = await fetch(API_CONFIG.BASE_URL, {
      method: 'GET',
      mode: 'cors'
    });
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    return response.ok;
  } catch (error) {
    console.error('Erro ao conectar com o backend:', error);
    return false;
  }
};

export const testAuthEndpoint = async (): Promise<boolean> => {
  try {
    console.log('Testando endpoint de auth...');
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/login`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sgvn.com',
        senha: 'admin123'
      })
    });
    
    console.log('Auth response status:', response.status);
    console.log('Auth response ok:', response.ok);
    
    const data = await response.json();
    console.log('Auth response data:', data);
    
    // Se retornou 200, está funcionando
    if (response.status === 200) {
      return true;
    }
    
    // Se retornou 401, o endpoint está funcionando mas credenciais erradas
    if (response.status === 401) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao testar endpoint de auth:', error);
    return false;
  }
};
