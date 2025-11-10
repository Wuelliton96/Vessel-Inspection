const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChecklistTemplate = sequelize.define('ChecklistTemplate', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tipo_embarcacao: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Tipo de embarcação (JET_SKI, LANCHA, etc)'
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nome do checklist'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'checklist_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ChecklistTemplate;


