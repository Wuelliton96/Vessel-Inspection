// backend/scripts/checkVistoriaStatus.js
const { Vistoria, StatusVistoria } = require('../models');

async function checkVistoriaStatus() {
  try {
    console.log('[VERIFICANDO] Verificando status das vistorias...\n');
    
    // Buscar todos os status
    const statusList = await StatusVistoria.findAll({
      order: [['id', 'ASC']]
    });
    
    console.log('Status disponíveis no sistema:');
    statusList.forEach(status => {
      console.log(`  ID: ${status.id} | Nome: ${status.nome} | Descrição: ${status.descricao}`);
    });
    
    console.log('\nVistorias no sistema:');
    const vistorias = await Vistoria.findAll({
      include: [
        { model: StatusVistoria, as: 'StatusVistoria' }
      ],
      order: [['id', 'ASC']]
    });
    
    vistorias.forEach(vistoria => {
      console.log(`  ID: ${vistoria.id} | Status ID: ${vistoria.status_id} | Status Nome: ${vistoria.StatusVistoria?.nome || 'N/A'} | Data Início: ${vistoria.data_inicio || 'Não iniciada'}`);
    });
    
    console.log('\n[OK] Verificação concluída!');
  } catch (error) {
    console.error('[ERRO] Erro ao verificar status:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkVistoriaStatus()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { checkVistoriaStatus };




