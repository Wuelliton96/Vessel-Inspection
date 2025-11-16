const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  senha_hash: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  nivel_acesso_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  deve_atualizar_senha: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Data e hora em que o usuário foi marcado como deletado (soft delete)'
  }
}, {
  tableName: 'usuarios',
  // Habilitar paranoid para soft delete automático
  paranoid: true,
  deletedAt: 'deleted_at'
});

module.exports = Usuario;