// backend/scripts/populateTiposFoto.js
/**
 * Script para popular tipos de foto padrão
 * 
 * NOTA: Este script está comentado porque os tipos de foto podem ser criados
 * via API (rota /api/tipos-foto-checklist) ou através de migrations.
 * 
 * A função popularTiposFoto() é mantida vazia para não quebrar populateDatabase.js
 */

// const { TipoFotoChecklist } = require('../models');

// const tiposFotoPadrao = [
//   {
//     codigo: 'FOTO001',
//     nome_exibicao: 'Foto Geral da Embarcação',
//     descricao: 'Foto geral mostrando a embarcação completa',
//     obrigatorio: true
//   },
//   {
//     codigo: 'FOTO002',
//     nome_exibicao: 'Foto do Motor',
//     descricao: 'Foto do motor da embarcação',
//     obrigatorio: true
//   },
//   {
//     codigo: 'FOTO003',
//     nome_exibicao: 'Foto do Casco',
//     descricao: 'Foto do casco da embarcação',
//     obrigatorio: true
//   },
//   {
//     codigo: 'FOTO004',
//     nome_exibicao: 'Foto do Interior',
//     descricao: 'Foto do interior da embarcação',
//     obrigatorio: true
//   },
//   {
//     codigo: 'FOTO005',
//     nome_exibicao: 'Foto dos Equipamentos de Segurança',
//     descricao: 'Foto dos equipamentos de segurança (coletes, extintores, etc.)',
//     obrigatorio: true
//   },
//   {
//     codigo: 'FOTO006',
//     nome_exibicao: 'Foto da Documentação',
//     descricao: 'Foto da documentação da embarcação',
//     obrigatorio: true
//   },
//   {
//     codigo: 'FOTO007',
//     nome_exibicao: 'Foto do Local de Atracação',
//     descricao: 'Foto do local onde a embarcação está atracada',
//     obrigatorio: false
//   },
//   {
//     codigo: 'FOTO008',
//     nome_exibicao: 'Foto de Detalhes Específicos',
//     descricao: 'Foto de detalhes específicos identificados durante a vistoria',
//     obrigatorio: false
//   }
// ];

// /**
//  * Cria ou atualiza um tipo de foto
//  */
// async function criarOuAtualizarTipoFoto(tipo) {
//   const [tipoCriado, criado] = await TipoFotoChecklist.findOrCreate({
//     where: { codigo: tipo.codigo },
//     defaults: tipo
//   });
//   
//   if (criado) {
//     console.log(`Tipo de foto criado: ${tipo.codigo} - ${tipo.nome_exibicao}`);
//   } else {
//     console.log(`Tipo de foto já existe: ${tipo.codigo} - ${tipo.nome_exibicao}`);
//   }
//   
//   return { tipoCriado, criado };
// }

async function popularTiposFoto() {
  // Função mantida vazia para não quebrar populateDatabase.js
  console.log('População de tipos de foto desabilitada - tipos podem ser criados via API ou migrations');
  return;
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

