// backend/utils/validators.js

/**
 * Valida um CPF brasileiro (11 dígitos)
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {boolean} - true se válido
 */
const validarCPF = (cpf) => {
  if (!cpf) return false;
  
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  // Validação dos dígitos verificadores
  let soma = 0;
  let resto;
  
  // Valida primeiro dígito
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
  
  // Valida segundo dígito
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
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {string} - CPF apenas com dígitos
 */
const limparCPF = (cpf) => {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
};

/**
 * Formata o CPF para exibição (000.000.000-00)
 * @param {string} cpf - CPF sem formatação (11 dígitos)
 * @returns {string} - CPF formatado
 */
const formatarCPF = (cpf) => {
  if (!cpf) return '';
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Valida um telefone no formato E.164
 * @param {string} telefone - Telefone no formato +5511999998888
 * @returns {boolean} - true se válido
 */
const validarTelefoneE164 = (telefone) => {
  if (!telefone) return false;
  
  // Formato E.164: +[código do país][código de área][número]
  // Exemplo: +5511999998888
  const regexE164 = /^\+[1-9]\d{1,14}$/;
  return regexE164.test(telefone);
};

/**
 * Converte telefone brasileiro para formato E.164
 * @param {string} telefone - Telefone no formato (11) 99999-8888 ou 11999998888
 * @returns {string} - Telefone no formato E.164 (+5511999998888)
 */
const converterParaE164 = (telefone) => {
  if (!telefone) return '';
  
  // Remove caracteres não numéricos
  const telefoneLimpo = telefone.replace(/\D/g, '');
  
  // Se já começa com o código do país (55), adiciona apenas o +
  if (telefoneLimpo.startsWith('55') && telefoneLimpo.length >= 12) {
    return '+' + telefoneLimpo;
  }
  
  // Se não tem código do país, adiciona +55 (Brasil)
  if (telefoneLimpo.length >= 10) {
    return '+55' + telefoneLimpo;
  }
  
  return telefone; // Retorna original se não conseguir converter
};

/**
 * Formata telefone E.164 para exibição (11) 99999-8888
 * @param {string} telefone - Telefone no formato E.164
 * @returns {string} - Telefone formatado
 */
const formatarTelefone = (telefone) => {
  if (!telefone) return '';
  
  // Remove o +55
  const telefoneLimpo = telefone.replace(/^\+55/, '').replace(/\D/g, '');
  
  // Formata: (11) 99999-8888 ou (11) 9999-8888
  if (telefoneLimpo.length === 11) {
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (telefoneLimpo.length === 10) {
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return telefone;
};

/**
 * Valida um estado brasileiro (UF)
 * @param {string} estado - Sigla do estado (2 letras)
 * @returns {boolean} - true se válido
 */
const validarEstado = (estado) => {
  if (!estado) return false;
  
  const estadosValidos = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  return estadosValidos.includes(estado.toUpperCase());
};

/**
 * Valida um valor monetário
 * @param {number|string} valor - Valor a validar
 * @returns {boolean} - true se válido
 */
const validarValorMonetario = (valor) => {
  if (valor === null || valor === undefined || valor === '') return true; // Aceita null (opcional)
  
  const valorNum = typeof valor === 'string' ? parseFloat(valor) : valor;
  
  // Verifica se é um número válido e positivo
  return !isNaN(valorNum) && valorNum >= 0 && valorNum < 100000000; // Máximo: 99.999.999,99
};

/**
 * Formata valor para armazenamento (remove símbolos e converte para número)
 * @param {string} valor - Valor formatado (ex: "R$ 1.500,00")
 * @returns {number|null} - Valor numérico ou null
 */
const limparValorMonetario = (valor) => {
  if (!valor || valor === '') return null;
  
  // Remove R$, pontos (milhares) e converte vírgula em ponto
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
 * @param {number|string} valor - Valor numérico
 * @returns {string} - Valor formatado (ex: "R$ 1.500,00")
 */
const formatarValorMonetario = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '';
  
  const valorNum = typeof valor === 'string' ? parseFloat(valor) : valor;
  
  if (isNaN(valorNum)) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valorNum);
};

/**
 * Valida critérios de senha forte
 * @param {string} senha - Senha a validar
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validatePassword = (senha) => {
  if (!senha || typeof senha !== 'string') {
    return {
      isValid: false,
      errors: ['Senha é obrigatória']
    };
  }

  const errors = [];
  
  if (senha.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(senha)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(senha)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(senha)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

module.exports = {
  validarCPF,
  limparCPF,
  formatarCPF,
  validarTelefoneE164,
  converterParaE164,
  formatarTelefone,
  validarEstado,
  validarValorMonetario,
  limparValorMonetario,
  formatarValorMonetario,
  validatePassword
};

