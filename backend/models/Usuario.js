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
    allowNull: true,
    defaultValue: null,
    unique: true
  },
  cpf: {
    type: DataTypes.STRING(11),
    allowNull: false,
    unique: true,
    validate: {
      len: [11, 11],
      is: /^[0-9]{11}$/
    },
    comment: 'CPF do usuário (11 dígitos, apenas números). Usado para login. Deve ser único.'
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
  },
  telefone_e164: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
    validate: {
      is: /^\+[1-9]\d{1,14}$/
    },
    comment: 'Telefone celular do vistoriador no formato E.164 (ex: +5511999998888)'
  },
  estado: {
    type: DataTypes.STRING(2),
    allowNull: true,
    defaultValue: null,
    validate: {
      isIn: [['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
              'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
              'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', null]]
    },
    comment: 'Estado onde o vistoriador atende (UF - 2 caracteres)'
  }
}, {
  tableName: 'usuarios',
  // Habilitar paranoid para soft delete automático
  paranoid: true,
  deletedAt: 'deleted_at'
});

module.exports = Usuario;