const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Local = sequelize.define('Local', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tipo: {
    type: DataTypes.ENUM('MARINA', 'RESIDENCIA'),
    allowNull: false
  },
  nome_local: {
    type: DataTypes.STRING
  },
  cep: {
    type: DataTypes.STRING
  },
  logradouro: {
    type: DataTypes.STRING
  },
  numero: {
    type: DataTypes.STRING
  },
  complemento: {
    type: DataTypes.STRING
  },
  bairro: {
    type: DataTypes.STRING
  },
  cidade: {
    type: DataTypes.STRING
  },
  estado: {
    type: DataTypes.STRING(2)
  }
}, {
  tableName: 'locais'
});

module.exports = Local;