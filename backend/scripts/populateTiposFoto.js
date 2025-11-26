// backend/scripts/populateTiposFoto.js
const { TipoFotoChecklist } = require('../models');

const tiposFotoPadrao = [
  {
    codigo: 'FOTO001',
    nome_exibicao: 'Foto Geral da Embarcação',
    descricao: 'Foto geral mostrando a embarcação completa',
    obrigatorio: true
  },
  {
    codigo: 'FOTO002',
    nome_exibicao: 'Foto do Motor',
    descricao: 'Foto do motor da embarcação',
    obrigatorio: true
  },
  {
    codigo: 'FOTO003',
    nome_exibicao: 'Foto do Casco',
    descricao: 'Foto do casco da embarcação',
    obrigatorio: true
  },
  {
    codigo: 'FOTO004',
    nome_exibicao: 'Foto do Interior',
    descricao: 'Foto do interior da embarcação',
    obrigatorio: true
  },
  {
    codigo: 'FOTO005',
    nome_exibicao: 'Foto dos Equipamentos de Segurança',
    descricao: 'Foto dos equipamentos de segurança (coletes, extintores, etc.)',
    obrigatorio: true
  },
  {
    codigo: 'FOTO006',
    nome_exibicao: 'Foto da Documentação',
    descricao: 'Foto da documentação da embarcação',
    obrigatorio: true
  },
  {
    codigo: 'FOTO007',
    nome_exibicao: 'Foto do Local de Atracação',
    descricao: 'Foto do local onde a embarcação está atracada',
    obrigatorio: false
  },
  {
    codigo: 'FOTO008',
    nome_exibicao: 'Foto de Detalhes Específicos',
    descricao: 'Foto de detalhes específicos identificados durante a vistoria',
    obrigatorio: false
  }
];

/**
 * Cria ou atualiza um tipo de foto
 */
async function criarOuAtualizarTipoFoto(tipo) {
  const [tipoCriado, criado] = await TipoFotoChecklist.findOrCreate({
    where: { codigo: tipo.codigo },
    defaults: tipo
  });
  
  if (criado) {
    console.log(`Tipo de foto criado: ${tipo.codigo} - ${tipo.nome_exibicao}`);
  } else {
    console.log(`Tipo de foto já existe: ${tipo.codigo} - ${tipo.nome_exibicao}`);
  }
  
  return { tipoCriado, criado };
}

async function popularTiposFoto() {
  try {
    console.log('Iniciando população dos tipos de foto...');
    
    for (const tipo of tiposFotoPadrao) {
      await criarOuAtualizarTipoFoto(tipo);
    }
    
    console.log('População dos tipos de foto concluída!');
  } catch (error) {
    console.error('Erro ao popular tipos de foto:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  popularTiposFoto()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { popularTiposFoto };

