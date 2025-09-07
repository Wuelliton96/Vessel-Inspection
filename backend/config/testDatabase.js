const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração do banco de dados para testes
const sequelize = new Sequelize(
  process.env.TEST_DATABASE_URL || 'postgres://localhost:5432/sgvn_test',
  {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false, // Desabilitar logs durante os testes
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    define: {
      underscored: true,
    }
  }
);

module.exports = sequelize;
