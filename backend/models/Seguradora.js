const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Seguradora = sequelize.define('Seguradora', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Nome da seguradora'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica se a seguradora está ativa'
  }
}, {
  tableName: 'seguradoras',
  timestamps: true,
  underscored: false,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Seguradora;


