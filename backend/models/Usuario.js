const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  // As colunas são definidas aqui
  clerk_user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
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
  nivel_acesso_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // Futuramente, adicionaremos a referência (foreign key) aqui
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  // Opções do modelo
  tableName: 'usuarios' // Força o nome da tabela a ser exatamente 'usuarios'
});

module.exports = Usuario;