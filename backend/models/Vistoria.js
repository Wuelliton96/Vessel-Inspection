// backend/models/Vistoria.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vistoria = sequelize.define('Vistoria', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  embarcacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  local_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vistoriador_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  administrador_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  aprovado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  dados_rascunho: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_conclusao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_aprovacao: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'vistorias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Vistoria;