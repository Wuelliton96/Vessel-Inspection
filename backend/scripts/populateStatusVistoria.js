// backend/scripts/populateStatusVistoria.js
const { StatusVistoria } = require('../models');

const statusVistoriaPadrao = [
  {
    nome: 'PENDENTE',
    descricao: 'Vistoria aguardando início'
  },
  {
    nome: 'EM_ANDAMENTO',
    descricao: 'Vistoria em andamento'
  },
  {
    nome: 'CONCLUIDA',
    descricao: 'Vistoria concluída pelo vistoriador'
  },
  {
    nome: 'APROVADA',
    descricao: 'Vistoria aprovada pelo administrador'
  },
  {
    nome: 'REJEITADA',
    descricao: 'Vistoria rejeitada pelo administrador'
  }
];

async function popularStatusVistoria() {
  try {
    console.log('Iniciando população dos status de vistoria...');
    
    for (const status of statusVistoriaPadrao) {
      const [statusCriado, criado] = await StatusVistoria.findOrCreate({
        where: { nome: status.nome },
        defaults: status
      });
      
      if (criado) {
        console.log(`Status criado: ${status.nome} - ${status.descricao}`);
      } else {
        console.log(`Status já existe: ${status.nome} - ${status.descricao}`);
      }
    }
    
    console.log('População dos status de vistoria concluída!');
  } catch (error) {
    console.error('Erro ao popular status de vistoria:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  popularStatusVistoria()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { popularStatusVistoria };

