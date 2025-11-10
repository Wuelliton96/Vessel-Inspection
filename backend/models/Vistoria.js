// backend/models/Vistoria.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vistoria = sequelize.define('Vistoria', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  embarcacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  local_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vistoriador_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  administrador_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  aprovado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  dados_rascunho: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_conclusao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  data_aprovacao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  valor_embarcacao: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Valor estimado da embarcação em R$'
  },
  valor_vistoria: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Valor total da vistoria em R$'
  },
  valor_vistoriador: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Valor a ser pago ao vistoriador em R$'
  },
  contato_acompanhante_tipo: {
    type: DataTypes.ENUM('PROPRIETARIO', 'MARINA', 'TERCEIRO'),
    allowNull: true,
    comment: 'Tipo de pessoa que acompanhará a vistoria'
  },
  contato_acompanhante_nome: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome da pessoa que acompanhará a vistoria'
  },
  contato_acompanhante_telefone_e164: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^\+[1-9]\d{1,14}$/
    },
    comment: 'Telefone do acompanhante no formato E.164 (+5511999998888)'
  },
  contato_acompanhante_email: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email da pessoa que acompanhará a vistoria'
  },
  corretora_nome: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome da corretora responsável'
  },
  corretora_telefone_e164: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^\+[1-9]\d{1,14}$/
    },
    comment: 'Telefone de contato da corretora no formato E.164'
  },
  corretora_email_laudo: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    },
    comment: 'E-mail da corretora para envio do laudo'
  }
}, {
  tableName: 'vistorias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Vistoria;