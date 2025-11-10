const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Embarcacao = sequelize.define('Embarcacao', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nr_inscricao_barco: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Número de Inscrição do Barco'
  },
  proprietario_nome: {
    type: DataTypes.STRING
  },
  proprietario_cpf: {
    type: DataTypes.CHAR(11),
    allowNull: true,
    validate: {
      len: [11, 11],
      isNumeric: true
    },
    comment: 'CPF do proprietário (apenas dígitos)'
  },
  proprietario_telefone_e164: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^\+[1-9]\d{1,14}$/
    },
    comment: 'Telefone do proprietário no formato E.164 (+5511999998888)'
  },
  proprietario_email: {
    type: DataTypes.STRING
  },
  tipo_embarcacao: {
    type: DataTypes.ENUM('JET_SKI', 'BALSA', 'IATE', 'VELEIRO', 'REBOCADOR', 'EMPURRADOR', 'LANCHA', 'BARCO', 'OUTRO'),
    allowNull: true,
    comment: 'Tipo/categoria da embarcação'
  },
  porte: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Porte da embarcação (ex: Pequeno, Médio, Grande ou tamanho em metros)'
  },
  seguradora_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'seguradoras',
      key: 'id'
    },
    comment: 'Seguradora responsável pela embarcação'
  },
  valor_embarcacao: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Valor estimado da embarcação em R$'
  },
  ano_fabricacao: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1900,
      max: 2100
    },
    comment: 'Ano de fabricação da embarcação'
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clientes',
      key: 'id'
    },
    comment: 'ID do cliente proprietário da embarcação'
  }
}, {
  tableName: 'embarcacoes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Embarcacao;