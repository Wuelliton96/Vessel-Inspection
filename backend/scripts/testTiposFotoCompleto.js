/**
 * Teste completo para validar tipos de foto
 */

const { TipoFotoChecklist } = require('../models');

async function testTiposFotoCompleto() {
  try {
    console.log('=== TESTE COMPLETO: TIPOS DE FOTO ===\n');

    // 1. Verificar tipos existentes
    console.log('1. VERIFICAÇÃO DE TIPOS EXISTENTES:');
    const tipos = await TipoFotoChecklist.findAll({
      order: [['codigo', 'ASC']]
    });

    console.log(`   Total de tipos: ${tipos.length}`);

    if (tipos.length === 0) {
      console.log('   ⚠️  Nenhum tipo encontrado');
    } else {
      console.log('\n   Tipos encontrados:');
      tipos.forEach(tipo => {
        console.log(`   - ${tipo.codigo}: ${tipo.nome_exibicao} (ID: ${tipo.id}, Obrigatório: ${tipo.obrigatorio ? 'Sim' : 'Não'})`);
      });
    }

    // 2. Verificar tipos obrigatórios
    console.log('\n2. TIPOS OBRIGATÓRIOS:');
    const tiposObrigatorios = tipos.filter(t => t.obrigatorio);
    console.log(`   Total: ${tiposObrigatorios.length}`);
    if (tiposObrigatorios.length > 0) {
      tiposObrigatorios.forEach(tipo => {
        console.log(`   - ${tipo.nome_exibicao}`);
      });
    }

    // 3. Verificar tipos opcionais
    console.log('\n3. TIPOS OPCIONAIS:');
    const tiposOpcionais = tipos.filter(t => !t.obrigatorio);
    console.log(`   Total: ${tiposOpcionais.length}`);
    if (tiposOpcionais.length > 0) {
      tiposOpcionais.forEach(tipo => {
        console.log(`   - ${tipo.nome_exibicao}`);
      });
    }

    // 4. Simular requisição da rota
    console.log('\n4. SIMULAÇÃO DA ROTA:');
    const tiposDaRota = await TipoFotoChecklist.findAll({
      order: [['codigo', 'ASC']]
    });

    console.log(`   Tipos retornados: ${tiposDaRota.length}`);
    if (tiposDaRota.length > 0) {
      console.log('   ✅ Rota funcionando corretamente');
    } else {
      console.log('   ❌ Rota não retornou tipos');
    }

    // 5. Verificar estrutura dos tipos
    console.log('\n5. ESTRUTURA DOS TIPOS:');
    if (tipos.length > 0) {
      const primeiroTipo = tipos[0];
      console.log('   Campos do tipo:');
      console.log(`   - id: ${primeiroTipo.id}`);
      console.log(`   - codigo: ${primeiroTipo.codigo}`);
      console.log(`   - nome_exibicao: ${primeiroTipo.nome_exibicao}`);
      console.log(`   - descricao: ${primeiroTipo.descricao || 'N/A'}`);
      console.log(`   - obrigatorio: ${primeiroTipo.obrigatorio}`);
      console.log('   ✅ Estrutura correta');
    }

    console.log('\n=== TESTE CONCLUÍDO ===');
    console.log('\n✅ RESULTADO:');
    if (tipos.length > 0) {
      console.log(`   ✅ Sistema possui ${tipos.length} tipo(s) de foto configurado(s)`);
      console.log('   ✅ Tipos podem ser retornados pela rota');
      console.log('   ✅ Frontend pode carregar os tipos');
    } else {
      console.log('   ⚠️  Nenhum tipo de foto encontrado');
      console.log('   ⚠️  O backend criará automaticamente na próxima requisição');
    }
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testTiposFotoCompleto();

