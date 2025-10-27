// backend/config/database.js
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Carrega .env do diretório do backend
const ENV_PATH = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: ENV_PATH });

// Sanitiza logs (não expõe user/senha)
const redact = (s) => (s ? s.replace(/:\/\/(.*?):(.*?)@/, '://****:****@') : s);

// Checagem básica
if (!process.env.DATABASE_URL) {
  const sample = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '(arquivo não encontrado)';
  console.error('[config/database] .env (primeiras linhas):\n', sample.split('\n').slice(0, 6).join('\n'));
  throw new Error('DATABASE_URL não definida em backend/.env');
}

// DB_SSL: false em Docker/local (sem SSL)
const DB_SSL = String(process.env.DB_SSL || '').trim().toLowerCase() === 'true';

// Opções base do Sequelize
/** @type {import('sequelize').Options} */
const options = {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: String(process.env.SEQ_LOG_SQL || '').toLowerCase() === 'true' ? console.log : false,
  pool: {
    max: Number(process.env.DB_POOL_MAX || 10),
    min: Number(process.env.DB_POOL_MIN || 0),
    acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
    idle: Number(process.env.DB_POOL_IDLE || 10000),
  },
  define: { underscored: true },
  dialectOptions: DB_SSL
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : { ssl: false },
};

console.log('[config/database] DATABASE_URL =', redact(process.env.DATABASE_URL));
console.log('[config/database] DB_SSL =', DB_SSL);

const sequelize = new Sequelize(process.env.DATABASE_URL, options);

module.exports = sequelize;
