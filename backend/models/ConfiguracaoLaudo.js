const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConfiguracaoLaudo = sequelize.define('ConfiguracaoLaudo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome_empresa: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  logo_empresa_url: {
    type: DataTypes.STRING(512),
    allowNull: true
  },
  nota_rodape: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  empresa_prestadora: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // Campo para identificar se é a configuração padrão (apenas uma pode ser padrão)
  padrao: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  // ID do usuário que criou/atualizou a configuração
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'configuracoes_laudo',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ConfiguracaoLaudo;

