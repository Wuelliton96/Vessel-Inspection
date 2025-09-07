const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Laudo = sequelize.define('Laudo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  url_pdf: { // Campo para os requisitos RF06 e RF07 [cite: 66, 67]
    type: DataTypes.STRING(512),
    allowNull: false
  },
  data_geracao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'laudos'
});

module.exports = Laudo;