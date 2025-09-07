const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StatusVistoria = sequelize.define('StatusVistoria', {
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
  tableName: 'status_vistoria'
});

module.exports = StatusVistoria;