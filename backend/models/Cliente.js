// backend/models/Cliente.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  tipo_pessoa: {
    type: DataTypes.ENUM('FISICA', 'JURIDICA'),
    allowNull: false,
    defaultValue: 'FISICA',
    comment: 'Tipo de pessoa: FISICA (CPF) ou JURIDICA (CNPJ)'
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nome completo (PF) ou Razão Social (PJ)'
  },
  cpf: {
    type: DataTypes.CHAR(11),
    allowNull: true,
    unique: true,
    validate: {
      len: [11, 11],
      isNumeric: true
    },
    comment: 'CPF (apenas dígitos) - obrigatório se tipo_pessoa = FISICA'
  },
  cnpj: {
    type: DataTypes.CHAR(14),
    allowNull: true,
    unique: true,
    validate: {
      len: [14, 14],
      isNumeric: true
    },
    comment: 'CNPJ (apenas dígitos) - obrigatório se tipo_pessoa = JURIDICA'
  },
  telefone_e164: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^\+[1-9]\d{1,14}$/
    },
    comment: 'Telefone no formato E.164 (+5511999998888)'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  
  // Endereço completo
  cep: {
    type: DataTypes.CHAR(8),
    allowNull: true,
    comment: 'CEP (apenas dígitos)'
  },
  logradouro: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Rua/Avenida do endereço'
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Número do imóvel'
  },
  complemento: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Complemento do endereço (apt, bloco, etc)'
  },
  bairro: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Bairro'
  },
  cidade: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Cidade'
  },
  estado: {
    type: DataTypes.CHAR(2),
    allowNull: true,
    comment: 'Estado (UF)'
  },
  
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'clientes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  validate: {
    // Garantir que tenha CPF OU CNPJ
    cpfOuCnpj() {
      if (this.tipo_pessoa === 'FISICA' && !this.cpf) {
        throw new Error('CPF é obrigatório para pessoa física');
      }
      if (this.tipo_pessoa === 'JURIDICA' && !this.cnpj) {
        throw new Error('CNPJ é obrigatório para pessoa jurídica');
      }
      if (this.tipo_pessoa === 'FISICA' && this.cnpj) {
        throw new Error('Pessoa física não pode ter CNPJ');
      }
      if (this.tipo_pessoa === 'JURIDICA' && this.cpf) {
        throw new Error('Pessoa jurídica não pode ter CPF');
      }
    }
  }
});

module.exports = Cliente;


