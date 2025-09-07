const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',

  pool: {
    max: 100, 
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // ---------------------

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  define: {
    underscored: true,
  }
});

module.exports = sequelize;