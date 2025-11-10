// backend/models/VistoriaLotePagamento.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VistoriaLotePagamento = sequelize.define('VistoriaLotePagamento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  lote_pagamento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lotes_pagamento',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  vistoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vistorias',
      key: 'id'
    }
  },
  valor_vistoriador: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Valor que o vistoriador receberá por esta vistoria específica'
  }
}, {
  tableName: 'vistorias_lote_pagamento',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = VistoriaLotePagamento;

