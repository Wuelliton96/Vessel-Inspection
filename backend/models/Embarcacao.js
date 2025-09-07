// backend/models/Embarcacao.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Embarcacao = sequelize.define('Embarcacao', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numero_casco: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  proprietario_nome: {
    type: DataTypes.STRING
  },
  proprietario_email: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'embarcacoes'
});

module.exports = Embarcacao;