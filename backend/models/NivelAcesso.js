const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NivelAcesso = sequelize.define('NivelAcesso', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  descricao: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'niveis_acesso'
});

module.exports = NivelAcesso;