// backend/config/jwt.js
// Configuração centralizada e segura para JWT

const logger = require('../utils/logger');

/**
 * Obtém o JWT_SECRET de forma segura
 * NUNCA usa fallback hardcoded em produção
 * @throws {Error} Se JWT_SECRET não estiver configurado em produção
 * @returns {string} JWT_SECRET
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Em produção, NUNCA usar fallback - isso é uma vulnerabilidade crítica
      logger.error('JWT_SECRET não configurado em produção!');
      throw new Error('JWT_SECRET não configurado. Configure a variável de ambiente JWT_SECRET.');
    } else {
      // Em desenvolvimento, usar fallback apenas para testes locais
      logger.warn('JWT_SECRET não configurado. Usando chave de desenvolvimento (NÃO SEGURO PARA PRODUÇÃO)');
      return 'dev-secret-key-not-for-production';
    }
  }
  
  // Validar que o secret tem tamanho mínimo recomendado
  if (secret.length < 32) {
    logger.warn('JWT_SECRET muito curto. Recomenda-se pelo menos 32 caracteres.');
  }
  
  return secret;
}

/**
 * Obtém o tempo de expiração do token JWT
 * @returns {string} Tempo de expiração (padrão: 24h)
 */
function getJwtExpiration() {
  return process.env.JWT_EXPIRATION || '24h';
}

module.exports = {
  getJwtSecret,
  getJwtExpiration
};

