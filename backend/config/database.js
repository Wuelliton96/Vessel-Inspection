const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const ENV_PATH = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: ENV_PATH });

const redact = (s) => (s ? s.replace(/:\/\/(.*?):(.*?)@/, '://****:****@') : s);

// PROTEÇÃO CRÍTICA: Em ambiente de teste, SEMPRE usar banco de teste
// Isso previne que testes apaguem dados de produção
const isTestEnv = process.env.NODE_ENV === 'test';
let databaseUrl;

if (isTestEnv) {
  // Em testes, usar TEST_DATABASE_URL ou fallback para banco local de teste
  databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL ou DATABASE_URL deve ser definida para ambiente de teste');
  }
  
  // Log de segurança para garantir que estamos usando banco de teste
  if (process.env.TEST_DATABASE_URL) {
    logger.warn('[config/database] AVISO: AMBIENTE DE TESTE: Usando TEST_DATABASE_URL');
  } else {
    logger.warn('[config/database] AVISO: AMBIENTE DE TESTE: Usando DATABASE_URL (considere usar TEST_DATABASE_URL)');
  }
  
  // Verificação adicional: se DATABASE_URL contém palavras-chave de produção, alertar
  const prodKeywords = ['prod', 'production', 'main', 'master'];
  if (databaseUrl && prodKeywords.some(keyword => databaseUrl.toLowerCase().includes(keyword))) {
    logger.error('[config/database] ALERTA DE SEGURANCA: URL de banco parece ser de PRODUCAO em ambiente de TESTE!');
    logger.error('[config/database] Configure TEST_DATABASE_URL com um banco de teste separado!');
  }
} else {
  // Em produção/desenvolvimento, usar DATABASE_URL normal
  databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    // Em produção, não expor conteúdo do .env
    if (process.env.NODE_ENV !== 'production') {
      const sample = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '(arquivo não encontrado)';
      logger.error('[config/database] .env (primeiras linhas):\n', sample.split('\n').slice(0, 6).join('\n'));
    }
    throw new Error('DATABASE_URL não definida em backend/.env');
  }
}

const DB_SSL = String(process.env.DB_SSL || '').trim().toLowerCase() === 'true';

// Detecta se a URL requer SSL (verifica se contém ?sslmode= ou similar)
const urlRequiresSSL = databaseUrl && (
  databaseUrl.includes('?sslmode=') ||
  databaseUrl.includes('?ssl=true') ||
  databaseUrl.includes('&sslmode=')
);

// Detecta se é uma URL de produção que geralmente requer SSL
const isProductionLike = databaseUrl && (
  databaseUrl.includes('amazonaws.com') ||
  databaseUrl.includes('heroku.com') ||
  databaseUrl.includes('render.com') ||
  databaseUrl.includes('railway.app') ||
  databaseUrl.includes('supabase.co') ||
  databaseUrl.includes('neon.tech') ||
  databaseUrl.includes('planetscale.com')
);

// Se DB_SSL estiver true OU a URL exigir SSL OU for uma URL de produção, configura SSL
// com rejeição de certificado desabilitada para aceitar certificados auto-assinados
const useSSL = DB_SSL || urlRequiresSSL || isProductionLike;

// Remove parâmetros SSL da URL para evitar conflito com dialectOptions
// O Sequelize deve usar apenas a configuração via dialectOptions
let cleanDatabaseUrl = databaseUrl;
if (useSSL) {
  // Remove ?sslmode=require ou similar da URL usando regex
  // Isso garante que não haja conflito entre o parâmetro da URL e dialectOptions
  const urlParts = cleanDatabaseUrl.split('?');
  if (urlParts.length > 1) {
    const baseUrl = urlParts[0];
    const params = urlParts[1];
    // Remove parâmetros SSL
    const cleanParams = params
      .split('&')
      .filter(param => !param.toLowerCase().startsWith('sslmode=') && !param.toLowerCase().startsWith('ssl='))
      .join('&');
    
    if (cleanParams) {
      cleanDatabaseUrl = `${baseUrl}?${cleanParams}`;
    } else {
      cleanDatabaseUrl = baseUrl;
    }
  }
}

// Função de logging que só funciona em desenvolvimento
const sqlLogger = process.env.NODE_ENV !== 'production' && 
                  String(process.env.SEQ_LOG_SQL || '').toLowerCase() === 'true' 
                  ? logger.debug.bind(logger) 
                  : false;

const options = {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: sqlLogger,
  pool: {
    max: Number(process.env.DB_POOL_MAX || 10),
    min: Number(process.env.DB_POOL_MIN || 0),
    acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
    idle: Number(process.env.DB_POOL_IDLE || 10000),
  },
  define: { underscored: true },
  dialectOptions: useSSL
    ? { 
        ssl: { 
          require: true,
          rejectUnauthorized: false  // Aceita certificados auto-assinados
        } 
      }
    : { ssl: false },
};

// Logs de configuração apenas em desenvolvimento/teste
if (process.env.NODE_ENV !== 'production') {
  logger.debug('[config/database] Ambiente =', process.env.NODE_ENV);
  logger.debug('[config/database] DATABASE_URL original =', redact(databaseUrl));
  logger.debug('[config/database] DATABASE_URL limpa =', redact(cleanDatabaseUrl));
  logger.debug('[config/database] DB_SSL =', DB_SSL);
  logger.debug('[config/database] URL requires SSL =', urlRequiresSSL);
  logger.debug('[config/database] Is production-like URL =', isProductionLike);
  logger.debug('[config/database] Using SSL (with rejectUnauthorized: false) =', useSSL);
}

const sequelize = new Sequelize(cleanDatabaseUrl, options);

module.exports = sequelize;
