const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SeguradoraTipoEmbarcacao = sequelize.define('SeguradoraTipoEmbarcacao', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  seguradora_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'seguradoras',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  tipo_embarcacao: {
    type: DataTypes.ENUM('LANCHA', 'JET_SKI', 'EMBARCACAO_COMERCIAL'),
    allowNull: false,
    comment: 'Tipo de embarcação permitido pela seguradora'
  }
}, {
  tableName: 'seguradora_tipo_embarcacao',
  timestamps: true,
  underscored: false,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      unique: true,
      fields: ['seguradora_id', 'tipo_embarcacao']
    }
  ]
});

module.exports = SeguradoraTipoEmbarcacao;


