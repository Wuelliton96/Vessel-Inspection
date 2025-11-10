require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sequelize } = require('../models');

const syncDatabase = async () => {
  try {
    console.log('=== SINCRONIZANDO BANCO DE DADOS ===');
    
    // Sincronizar o banco de dados (alter: true para modificar tabelas existentes)
    await sequelize.sync({ alter: true });
    console.log('Banco de dados sincronizado com sucesso!');
    
    console.log('=== SINCRONIZAÇÃO CONCLUÍDA ===');
  } catch (error) {
    console.error('Erro durante a sincronização do banco de dados:', error);
  } finally {
    await sequelize.close();
  }
};

syncDatabase();






