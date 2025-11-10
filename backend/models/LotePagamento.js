const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LotePagamento = sequelize.define('LotePagamento', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  vistoriador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  periodo_tipo: {
    type: DataTypes.ENUM('DIARIO', 'SEMANAL', 'MENSAL'),
    allowNull: false,
    defaultValue: 'MENSAL',
    comment: 'Tipo de período do lote de pagamento'
  },
  data_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Data de início do período'
  },
  data_fim: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Data de fim do período'
  },
  quantidade_vistorias: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Quantidade de vistorias incluídas neste lote'
  },
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Valor total a pagar ao vistoriador (soma de todas as vistorias)'
  },
  status: {
    type: DataTypes.ENUM('PENDENTE', 'PAGO', 'CANCELADO'),
    allowNull: false,
    defaultValue: 'PENDENTE',
    comment: 'Status do pagamento'
  },
  data_pagamento: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data em que o pagamento foi efetuado'
  },
  forma_pagamento: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Forma de pagamento (PIX, TRANSFERENCIA, DINHEIRO, etc)'
  },
  comprovante_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL do comprovante de pagamento'
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observações sobre o pagamento'
  },
  pago_por_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'ID do administrador que efetuou o pagamento'
  }
}, {
  tableName: 'lotes_pagamento',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = LotePagamento;

