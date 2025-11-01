const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Foto = sequelize.define('Foto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  url_arquivo: { // Campo para o requisito RF04
    type: DataTypes.STRING(512),
    allowNull: false
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  vistoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_foto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'fotos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Foto;