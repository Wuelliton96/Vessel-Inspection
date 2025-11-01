const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TipoFotoChecklist = sequelize.define('TipoFotoChecklist', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  codigo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  nome_exibicao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT
  },
  obrigatorio: { // Essencial para o requisito RF05 [cite: 64]
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'tipos_foto_checklist',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TipoFotoChecklist;