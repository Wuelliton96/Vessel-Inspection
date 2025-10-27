const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  // As colunas são definidas aqui
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
    allowNull: false,
    // Futuramente, adicionaremos a referência (foreign key) aqui
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
  }
}, {
  // Opções do modelo
  tableName: 'usuarios' // Força o nome da tabela a ser exatamente 'usuarios'
});

module.exports = Usuario;