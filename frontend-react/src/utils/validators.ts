/**
 * Valida um CPF brasileiro (11 dígitos)
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido
 */
export const validarCPF = (cpf: string): boolean => {
  if (!cpf) return false;
  
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  let soma = 0;
  let resto: number;
  
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;
  
  return true;
};

/**
 * Limpa o CPF deixando apenas dígitos
 * @param cpf - CPF com ou sem formatação
 * @returns CPF apenas com dígitos
 */
export const limparCPF = (cpf: string): string => {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
};

/**
 * Formata o CPF para exibição (000.000.000-00)
 * @param cpf - CPF sem formatação (11 dígitos)
 * @returns CPF formatado
 */
export const formatarCPF = (cpf: string): string => {
  if (!cpf) return '';
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CPF enquanto digita (máscara)
 * @param value - Valor digitado
 * @returns Valor formatado
 */
export const mascaraCPF = (value: string): string => {
  const cpfLimpo = value.replace(/\D/g, '');
  
  if (cpfLimpo.length <= 3) {
    return cpfLimpo;
  } else if (cpfLimpo.length <= 6) {
    return cpfLimpo.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  } else if (cpfLimpo.length <= 9) {
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else {
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  }
};

/**
 * Valida um telefone no formato E.164
 * @param telefone - Telefone no formato +5511999998888
 * @returns true se válido
 */
export const validarTelefoneE164 = (telefone: string): boolean => {
  if (!telefone) return false;
  const regexE164 = /^\+[1-9]\d{1,14}$/;
  return regexE164.test(telefone);
};

/**
 * Converte telefone brasileiro para formato E.164
 * @param telefone - Telefone no formato (11) 99999-8888 ou 11999998888
 * @returns Telefone no formato E.164 (+5511999998888)
 */
export const converterParaE164 = (telefone: string): string => {
  if (!telefone) return '';
  
  const telefoneLimpo = telefone.replace(/\D/g, '');
  
  if (telefoneLimpo.startsWith('55') && telefoneLimpo.length >= 12) {
    return '+' + telefoneLimpo;
  }
  
  if (telefoneLimpo.length >= 10) {
    return '+55' + telefoneLimpo;
  }
  
  return telefone;
};

/**
 * Formata telefone E.164 para exibição brasileira (11) 99999-8888
 * @param telefone - Telefone no formato E.164
 * @returns Telefone formatado
 */
export const formatarTelefone = (telefone: string): string => {
  if (!telefone) return '';
  
  const telefoneLimpo = telefone.replace(/^\+55/, '').replace(/\D/g, '');
  
  if (telefoneLimpo.length === 11) {
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (telefoneLimpo.length === 10) {
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return telefone;
};

/**
 * Valida um CNPJ brasileiro (14 dígitos)
 * @param cnpj - CNPJ com ou sem formatação
 * @returns true se válido
 */
export const validarCNPJ = (cnpj: string): boolean => {
  if (!cnpj) return false;
  
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  
  if (cnpjLimpo.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;
  
  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  
  return true;
};

/**
 * Limpa o CNPJ deixando apenas dígitos
 * @param cnpj - CNPJ com ou sem formatação
 * @returns CNPJ apenas com dígitos
 */
export const limparCNPJ = (cnpj: string): string => {
  if (!cnpj) return '';
  return cnpj.replace(/\D/g, '');
};

/**
 * Formata o CNPJ para exibição (00.000.000/0000-00)
 * @param cnpj - CNPJ sem formatação (14 dígitos)
 * @returns CNPJ formatado
 */
export const formatarCNPJ = (cnpj: string): string => {
  if (!cnpj) return '';
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) return cnpj;
  return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Máscara de CNPJ enquanto digita
 * @param value - Valor digitado
 * @returns Valor formatado
 */
export const mascaraCNPJ = (value: string): string => {
  const cnpjLimpo = value.replace(/\D/g, '');
  
  if (cnpjLimpo.length <= 2) {
    return cnpjLimpo;
  } else if (cnpjLimpo.length <= 5) {
    return cnpjLimpo.replace(/(\d{2})(\d{0,3})/, '$1.$2');
  } else if (cnpjLimpo.length <= 8) {
    return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else if (cnpjLimpo.length <= 12) {
    return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
  } else {
    return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
  }
};

/**
 * Máscara inteligente de CPF ou CNPJ (detecta automaticamente)
 * @param value - Valor digitado
 * @returns Valor formatado (CPF ou CNPJ)
 */
export const mascaraDocumento = (value: string): string => {
  const numeros = value.replace(/\D/g, '');
  
  // Se tem 14 ou mais dígitos, formata como CNPJ
  if (numeros.length > 11) {
    return mascaraCNPJ(value);
  }
  // Caso contrário, formata como CPF
  return mascaraCPF(value);
};

/**
 * Mascara telefone enquanto digita
 * @param value - Valor digitado
 * @returns Valor formatado
 */
export const mascaraTelefone = (value: string): string => {
  const telefoneLimpo = value.replace(/\D/g, '');
  
  if (telefoneLimpo.length <= 2) {
    return telefoneLimpo;
  } else if (telefoneLimpo.length <= 7) {
    return telefoneLimpo.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  } else if (telefoneLimpo.length <= 10) {
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else {
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  }
};

/**
 * Valida um estado brasileiro (UF)
 * @param estado - Sigla do estado (2 letras)
 * @returns true se válido
 */
export const validarEstado = (estado: string): boolean => {
  if (!estado) return false;
  
  const estadosValidos = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  return estadosValidos.includes(estado.toUpperCase());
};

/**
 * Lista de tipos de embarcação (LEGADO - mantido para compatibilidade)
 */
export const TIPOS_EMBARCACAO = [
  { value: 'JET_SKI', label: 'Jet Ski' },
  { value: 'BALSA', label: 'Balsa' },
  { value: 'IATE', label: 'Iate' },
  { value: 'VELEIRO', label: 'Veleiro' },
  { value: 'REBOCADOR', label: 'Rebocador' },
  { value: 'EMPURRADOR', label: 'Empurrador' },
  { value: 'LANCHA', label: 'Lancha' },
  { value: 'BARCO', label: 'Barco' },
  { value: 'OUTRO', label: 'Outro' }
];

/**
 * Tipos de embarcação das seguradoras (NOVO SISTEMA)
 */
export const TIPOS_EMBARCACAO_SEGURADORA = [
  { value: 'LANCHA', label: 'Lancha' },
  { value: 'JET_SKI', label: 'Jet Ski' },
  { value: 'EMBARCACAO_COMERCIAL', label: 'Embarcação Comercial' }
];

export const TIPOS_POR_SEGURADORA: Record<string, string[]> = {
  'Essor': ['LANCHA', 'JET_SKI'],
  'Mapfre': ['LANCHA', 'EMBARCACAO_COMERCIAL'],
  'Swiss RE': ['EMBARCACAO_COMERCIAL'],
  'AXA Seguros': ['EMBARCACAO_COMERCIAL'],
  'Fairfax': ['EMBARCACAO_COMERCIAL']
};

/**
 * Função para obter label do tipo de embarcação seguradora
 */
export const getLabelTipoEmbarcacaoSeguradora = (tipo: string): string => {
  const item = TIPOS_EMBARCACAO_SEGURADORA.find(t => t.value === tipo);
  return item ? item.label : tipo;
};

/**
 * Lista de portes de embarcação
 */
export const PORTES_EMBARCACAO = [
  { value: 'PEQUENO', label: 'Pequeno (até 10m)' },
  { value: 'MEDIO', label: 'Médio (10m a 24m)' },
  { value: 'GRANDE', label: 'Grande (acima de 24m)' }
];

/**
 * Lista de todos os estados brasileiros
 */
export const ESTADOS_BRASILEIROS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

/**
 * Valida um valor monetário
 * @param valor - Valor a validar
 * @returns true se válido
 */
export const validarValorMonetario = (valor: number | string | null | undefined): boolean => {
  if (valor === null || valor === undefined || valor === '') return true;
  
  const valorNum = typeof valor === 'string' ? parseFloat(valor) : valor;
  
  return !isNaN(valorNum) && valorNum >= 0 && valorNum < 100000000;
};

/**
 * Formata valor para armazenamento (remove símbolos e converte para número)
 * @param valor - Valor formatado (ex: "R$ 1.500,00" ou "1.500,00" ou "1500")
 * @returns Valor numérico ou null
 */
export const limparValorMonetario = (valor: string | number | null | undefined): number | null => {
  if (!valor || valor === '') return null;
  
  const valorLimpo = String(valor)
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  
  const valorNum = parseFloat(valorLimpo);
  return isNaN(valorNum) ? null : valorNum;
};

/**
 * Formata valor monetário para exibição em Real brasileiro
 * @param valor - Valor numérico
 * @returns Valor formatado (ex: "R$ 1.500,00")
 */
export const formatarValorMonetario = (valor: number | string | null | undefined): string => {
  if (valor === null || valor === undefined || valor === '') return '';
  
  const valorNum = typeof valor === 'string' ? parseFloat(valor) : valor;
  
  if (isNaN(valorNum)) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valorNum);
};

/**
 * Máscara de valor monetário enquanto digita
 * @param value - Valor digitado
 * @returns Valor formatado
 */
export const mascaraValorMonetario = (value: string): string => {
  if (!value) return '';
  
  const apenasNumeros = value.replace(/\D/g, '');
  
  if (!apenasNumeros) return '';
  
  const valorEmCentavos = parseInt(apenasNumeros);
  const valorEmReais = valorEmCentavos / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valorEmReais);
};

/**
 * Tipos de contato/acompanhante para vistorias
 */
export const TIPOS_CONTATO_ACOMPANHANTE = [
  { value: 'PROPRIETARIO', label: 'Proprietário da Embarcação' },
  { value: 'MARINA', label: 'Representante da Marina' },
  { value: 'TERCEIRO', label: 'Terceiro Designado' }
];

