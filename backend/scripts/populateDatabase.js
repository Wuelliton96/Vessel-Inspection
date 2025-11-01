// backend/scripts/populateDatabase.js
const { popularTiposFoto } = require('./populateTiposFoto');
const { popularStatusVistoria } = require('./populateStatusVistoria');

async function popularBancoCompleto() {
  try {
    console.log('=== INICIANDO POPULAÇÃO COMPLETA DO BANCO ===');
    
    await popularStatusVistoria();
    await popularTiposFoto();
    
    console.log('=== POPULAÇÃO COMPLETA DO BANCO CONCLUÍDA ===');
  } catch (error) {
    console.error('Erro na população do banco:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  popularBancoCompleto()
    .then(() => {
      console.log('Script de população concluído com sucesso!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Erro no script de população:', error);
      process.exit(1);
    });
}

module.exports = { popularBancoCompleto };

