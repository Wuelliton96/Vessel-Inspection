/**
 * Teste completo end-to-end para validar conclusão sem foto
 * Simula o fluxo completo do frontend ao backend
 */

const E2ETestBase = require('../tests/helpers/e2eTestBase');
const { VistoriaChecklistItem } = require('../models');

async function testConcluirSemFotoCompleto() {
  try {
    console.log('=== TESTE COMPLETO: CONCLUIR SEM FOTO ===\n');

    const testBase = new E2ETestBase();

    // 1. Buscar item não obrigatório pendente
    const item = await testBase.findPendingItem({ obrigatorio: false });

    if (!item) {
      console.log('Nenhum item não obrigatório pendente encontrado');
      process.exit(0);
    }

    console.log('1. ITEM ENCONTRADO:');
    testBase.logItemInfo();
    console.log('');

    // 2. Contar itens antes
    const itensAntes = await VistoriaChecklistItem.findAll({
      where: { vistoria_id: item.vistoria_id }
    });

    const pendentesAntes = itensAntes.filter(i => i.status !== 'CONCLUIDO').length;
    const concluidosAntes = itensAntes.filter(i => i.status === 'CONCLUIDO').length;

    console.log('2. ESTADO ANTES:');
    console.log(`   Total de itens: ${itensAntes.length}`);
    console.log(`   Pendentes: ${pendentesAntes}`);
    console.log(`   Concluídos: ${concluidosAntes}\n`);

    // 3. Simular atualização (como a rota PATCH faria)
    console.log('3. ATUALIZANDO PARA CONCLUIDO SEM FOTO:');
    await testBase.markItemAsCompleted(null);

    testBase.logItemState('   ');
    console.log('');

    // 4. Contar itens depois
    const itensDepois = await VistoriaChecklistItem.findAll({
      where: { vistoria_id: item.vistoria_id }
    });

    const pendentesDepois = itensDepois.filter(i => i.status !== 'CONCLUIDO').length;
    const concluidosDepois = itensDepois.filter(i => i.status === 'CONCLUIDO').length;

    console.log('4. ESTADO DEPOIS:');
    console.log(`   Total de itens: ${itensDepois.length}`);
    console.log(`   Pendentes: ${pendentesDepois}`);
    console.log(`   Concluídos: ${concluidosDepois}\n`);

    // 5. Validações
    console.log('5. VALIDAÇÕES:');
    const validation = testBase.validateItemState('CONCLUIDO', null);
    let todasValido = validation.isValid;

    if (validation.isValid) {
      console.log('   OK: Item foi marcado como CONCLUIDO');
      console.log('   OK: Foto ID é null (concluído sem foto)');
      console.log('   OK: concluido_em foi definido');
    } else {
      validation.errors.forEach(error => {
        console.log(`   ERRO: ${error}`);
      });
    }

    // Verificar se o item saiu da lista de pendentes
    if (pendentesDepois !== pendentesAntes - 1) {
      console.log(`   ERRO: Número de pendentes não diminuiu corretamente`);
      console.log(`   Esperado: ${pendentesAntes - 1}, Recebido: ${pendentesDepois}`);
      todasValido = false;
    } else {
      console.log('   OK: Item saiu da lista de pendentes');
    }

    // Verificar se o item entrou na lista de concluídos
    if (concluidosDepois !== concluidosAntes + 1) {
      console.log(`   ERRO: Número de concluídos não aumentou corretamente`);
      console.log(`   Esperado: ${concluidosAntes + 1}, Recebido: ${concluidosDepois}`);
      todasValido = false;
    } else {
      console.log('   OK: Item entrou na lista de concluídos');
    }

    // Verificar se o item aparece na lista correta
    const itemNaListaPendentes = itensDepois.filter(i => i.status !== 'CONCLUIDO').some(i => i.id === item.id);
    const itemNaListaConcluidos = itensDepois.filter(i => i.status === 'CONCLUIDO').some(i => i.id === item.id);

    if (itemNaListaPendentes) {
      console.log('   ERRO: Item ainda aparece na lista de pendentes');
      todasValido = false;
    } else {
      console.log('   OK: Item não aparece mais na lista de pendentes');
    }

    if (!itemNaListaConcluidos) {
      console.log('   ERRO: Item não aparece na lista de concluídos');
      todasValido = false;
    } else {
      console.log('   OK: Item aparece na lista de concluídos');
    }

    // 6. Voltar para PENDENTE
    console.log('\n6. TESTANDO VOLTAR PARA PENDENTE:');
    await testBase.markItemAsPending();

    const itensFinal = await VistoriaChecklistItem.findAll({
      where: { vistoria_id: item.vistoria_id }
    });

    const pendentesFinal = itensFinal.filter(i => i.status !== 'CONCLUIDO').length;
    const concluidosFinal = itensFinal.filter(i => i.status === 'CONCLUIDO').length;

    if (pendentesFinal === pendentesAntes && concluidosFinal === concluidosAntes) {
      console.log('   OK: Item voltou para PENDENTE corretamente');
    } else {
      console.log('   ERRO: Item não voltou para PENDENTE corretamente');
      todasValido = false;
    }

    console.log('\n=== RESULTADO FINAL ===');
    if (todasValido) {
      console.log('OK: Todos os testes passaram!');
      console.log('A funcionalidade está 100% funcional.');
      console.log('O item não obrigatório pode ser concluído sem foto e sai da lista de pendentes corretamente.');
    } else {
      console.log('ERRO: Alguns testes falharam');
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(todasValido ? 0 : 1);
  } catch (error) {
    console.error('Erro no teste:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testConcluirSemFotoCompleto();

