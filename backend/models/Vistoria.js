// backend/models/Vistoria.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vistoria = sequelize.define('Vistoria', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  dados_rascunho: {
    type: DataTypes.JSONB
  },
  data_conclusao: {
    type: DataTypes.DATE
  },
  data_aprovacao: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'vistorias'
});

module.exports = Vistoria;