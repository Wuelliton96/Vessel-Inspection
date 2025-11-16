const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditoriaLog = sequelize.define('AuditoriaLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Pode ser null caso o usuário seja deletado
    comment: 'ID do usuário que executou a ação'
  },
  usuario_email: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Email do usuário (guardado para histórico)'
  },
  usuario_nome: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nome do usuário (guardado para histórico)'
  },
  acao: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Tipo de ação: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc'
  },
  entidade: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Nome da entidade afetada: Usuario, Vistoria, Cliente, etc'
  },
  entidade_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID da entidade afetada'
  },
  dados_anteriores: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON com dados antes da modificação'
  },
  dados_novos: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON com dados após a modificação'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Endereço IP do usuário'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent do navegador'
  },
  nivel_critico: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Se true, indica uma ação crítica que requer atenção'
  },
  detalhes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detalhes adicionais sobre a ação'
  }
}, {
  tableName: 'auditoria_logs',
  timestamps: true,
  updatedAt: false, // Logs de auditoria não devem ser atualizados
  underscored: false, // Usar camelCase como na tabela
  createdAt: 'createdAt' // Mapear explicitamente
});

module.exports = AuditoriaLog;

