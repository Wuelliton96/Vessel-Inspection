const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VistoriaChecklistItem = sequelize.define('VistoriaChecklistItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  vistoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vistorias',
      key: 'id'
    },
    comment: 'ID da vistoria'
  },
  template_item_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'checklist_template_itens',
      key: 'id'
    },
    comment: 'ID do item do template (null se customizado)'
  },
  ordem: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Ordem de exibição'
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nome do item'
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descrição/instruções'
  },
  obrigatorio: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  permite_video: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('PENDENTE', 'CONCLUIDO', 'NAO_APLICAVEL'),
    allowNull: false,
    defaultValue: 'PENDENTE',
    comment: 'Status do item do checklist'
  },
  foto_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'fotos',
      key: 'id'
    },
    comment: 'ID da foto vinculada'
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  concluido_em: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data/hora da conclusão'
  }
}, {
  tableName: 'vistoria_checklist_itens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = VistoriaChecklistItem;


