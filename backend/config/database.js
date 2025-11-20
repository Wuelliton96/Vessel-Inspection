const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const ENV_PATH = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: ENV_PATH });

const redact = (s) => (s ? s.replace(/:\/\/(.*?):(.*?)@/, '://****:****@') : s);

if (!process.env.DATABASE_URL) {
  // Em produção, não expor conteúdo do .env
  if (process.env.NODE_ENV !== 'production') {
    const sample = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '(arquivo não encontrado)';
    logger.error('[config/database] .env (primeiras linhas):\n', sample.split('\n').slice(0, 6).join('\n'));
  }
  throw new Error('DATABASE_URL não definida em backend/.env');
}

const DB_SSL = String(process.env.DB_SSL || '').trim().toLowerCase() === 'true';

// Detecta se a URL requer SSL (verifica se contém ?sslmode= ou similar)
const urlRequiresSSL = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('?sslmode=') ||
  process.env.DATABASE_URL.includes('?ssl=true') ||
  process.env.DATABASE_URL.includes('&sslmode=')
);

// Detecta se é uma URL de produção que geralmente requer SSL
const isProductionLike = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('amazonaws.com') ||
  process.env.DATABASE_URL.includes('heroku.com') ||
  process.env.DATABASE_URL.includes('render.com') ||
  process.env.DATABASE_URL.includes('railway.app') ||
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('neon.tech') ||
  process.env.DATABASE_URL.includes('planetscale.com')
);

// Se DB_SSL estiver true OU a URL exigir SSL OU for uma URL de produção, configura SSL
// com rejeição de certificado desabilitada para aceitar certificados auto-assinados
const useSSL = DB_SSL || urlRequiresSSL || isProductionLike;

// Remove parâmetros SSL da URL para evitar conflito com dialectOptions
// O Sequelize deve usar apenas a configuração via dialectOptions
let cleanDatabaseUrl = process.env.DATABASE_URL;
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

// Logs de configuração apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.debug('[config/database] DATABASE_URL original =', redact(process.env.DATABASE_URL));
  logger.debug('[config/database] DATABASE_URL limpa =', redact(cleanDatabaseUrl));
  logger.debug('[config/database] DB_SSL =', DB_SSL);
  logger.debug('[config/database] URL requires SSL =', urlRequiresSSL);
  logger.debug('[config/database] Is production-like URL =', isProductionLike);
  logger.debug('[config/database] Using SSL (with rejectUnauthorized: false) =', useSSL);
}

const sequelize = new Sequelize(cleanDatabaseUrl, options);

module.exports = sequelize;
