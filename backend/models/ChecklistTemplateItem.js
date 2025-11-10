const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChecklistTemplateItem = sequelize.define('ChecklistTemplateItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  checklist_template_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'checklist_templates',
      key: 'id'
    },
    comment: 'ID do template de checklist'
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Ordem de exibição do item'
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nome do item (ex: Proa, Popa)'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição detalhada/instruções'
  },
  obrigatorio: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Se a foto é obrigatória'
  },
  permite_video: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Se permite vídeo ao invés de foto'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'checklist_template_itens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ChecklistTemplateItem;


