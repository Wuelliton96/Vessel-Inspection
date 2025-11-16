/**
 * Script para recuperar múltiplos usuários deletados de uma vez
 * Útil em caso de deleção acidental em massa
 * 
 * Uso: node backend/scripts/recuperarUsuariosEmMassa.js [data_inicio] [data_fim]
 * 
 * Exemplos:
 *   node backend/scripts/recuperarUsuariosEmMassa.js
 *   node backend/scripts/recuperarUsuariosEmMassa.js 2024-11-14
 *   node backend/scripts/recuperarUsuariosEmMassa.js 2024-11-14 2024-11-15
 */

require('dotenv').config();
const { Usuario, NivelAcesso } = require('../models');
const { Op } = require('sequelize');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function perguntar(questao) {
  return new Promise((resolve) => {
    rl.question(questao, (resposta) => {
      resolve(resposta);
    });
  });
}

async function recuperarUsuariosEmMassa(dataInicio, dataFim) {
  try {
    console.log('\n🔍 Buscando usuários deletados...\n');

    // Construir filtro de data
    const where = {
      deleted_at: { [Op.ne]: null }
    };

    if (dataInicio || dataFim) {
      const dateFilter = {};
      if (dataInicio) {
        dateFilter[Op.gte] = new Date(dataInicio + ' 00:00:00');
      }
      if (dataFim) {
        dateFilter[Op.lte] = new Date(dataFim + ' 23:59:59');
      }
      where.deleted_at = dateFilter;
    }

    const deletados = await Usuario.findAll({
      paranoid: false,
      where,
      include: { 
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      order: [['deleted_at', 'DESC']]
    });

    if (deletados.length === 0) {
      console.log('✅ Nenhum usuário deletado encontrado no período especificado\n');
      return;
    }

    console.log(`📋 Usuários deletados encontrados: ${deletados.length}\n`);
    console.log('━'.repeat(80));

    deletados.forEach((usuario, index) => {
      console.log(`${index + 1}. ${usuario.nome} (${usuario.email})`);
      console.log(`   Nível: ${usuario.NivelAcesso.nome}`);
      console.log(`   Deletado em: ${usuario.deleted_at.toLocaleString('pt-BR')}`);
      console.log('');
    });

    console.log('━'.repeat(80));
    
    // Confirmação
    const resposta = await perguntar(
      `\n⚠️  Deseja recuperar TODOS estes ${deletados.length} usuários? (sim/não): `
    );

    if (resposta.toLowerCase() !== 'sim') {
      console.log('\n❌ Operação cancelada pelo usuário\n');
      return;
    }

    console.log('\n🔄 Recuperando usuários...\n');

    let sucesso = 0;
    let erros = 0;

    for (const usuario of deletados) {
      try {
        await usuario.restore();
        console.log(`✅ ${usuario.nome} (${usuario.email})`);
        sucesso++;
      } catch (error) {
        console.log(`❌ Erro ao recuperar ${usuario.email}: ${error.message}`);
        erros++;
      }
    }

    console.log('\n' + '━'.repeat(80));
    console.log('\n📊 Resultado:');
    console.log(`   ✅ Recuperados: ${sucesso}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📝 Total: ${deletados.length}\n`);
    
  } catch (error) {
    console.error('❌ Erro ao recuperar usuários:', error.message);
    console.error('   Detalhes:', error);
    console.log('');
  } finally {
    rl.close();
    process.exit();
  }
}

// Processar argumentos
const dataInicio = process.argv[2];
const dataFim = process.argv[3];

if (dataInicio && !/^\d{4}-\d{2}-\d{2}$/.test(dataInicio)) {
  console.log('\n❌ Formato de data inválido');
  console.log('   Use: AAAA-MM-DD (exemplo: 2024-11-14)\n');
  process.exit(1);
}

if (dataFim && !/^\d{4}-\d{2}-\d{2}$/.test(dataFim)) {
  console.log('\n❌ Formato de data inválido');
  console.log('   Use: AAAA-MM-DD (exemplo: 2024-11-14)\n');
  process.exit(1);
}

// Executar
console.log('\n🛡️  RECUPERAÇÃO EM MASSA DE USUÁRIOS DELETADOS');
console.log('━'.repeat(80));

if (dataInicio && dataFim) {
  console.log(`📅 Período: ${dataInicio} até ${dataFim}`);
} else if (dataInicio) {
  console.log(`📅 A partir de: ${dataInicio}`);
} else {
  console.log('📅 Período: TODOS os usuários deletados');
}

recuperarUsuariosEmMassa(dataInicio, dataFim);

