// Função para buscar dados do CEP via ViaCEP
export interface CEPData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const buscarCEP = async (cep: string): Promise<CEPData | null> => {
  try {
    // Remove caracteres não numéricos e valida formato
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Validação: deve ter exatamente 8 dígitos
    if (cepLimpo.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }
    
    // Faz a requisição para o ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao consultar CEP');
    }
    
    const data: CEPData = await response.json();
    
    // Verifica se o CEP foi encontrado
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
};

// Função para formatar CEP (adiciona hífen)
export const formatarCEP = (cep: string): string => {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length <= 5) {
    return cepLimpo;
  }
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`;
};

// Função para validar formato de CEP
export const validarCEP = (cep: string): boolean => {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8;
};

