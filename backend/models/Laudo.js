const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Laudo = sequelize.define('Laudo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  url_pdf: {
    type: DataTypes.STRING(512),
    allowNull: false
  },
  data_geracao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  vistoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'laudos',
  hooks: {
    beforeUpdate: (laudo) => {
      if (laudo.changed('data_geracao')) {
        laudo.set('data_geracao', laudo.previous('data_geracao'));
      }
    }
  }
});

module.exports = Laudo;