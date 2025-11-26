/**
 * Teste completo para validar conclusão de item não obrigatório sem foto
 */

const E2ETestBase = require('../tests/helpers/e2eTestBase');

async function testConcluirSemFoto() {
  try {
    console.log('=== TESTE: CONCLUIR ITEM NÃO OBRIGATÓRIO SEM FOTO ===\n');

    const testBase = new E2ETestBase();

    // Buscar item não obrigatório pendente
    const item = await testBase.findPendingItem({ obrigatorio: false });

    if (!item) {
      console.log('Nenhum item não obrigatório pendente encontrado');
      process.exit(0);
    }

    testBase.logItemInfo();
    console.log('');

    // Estado ANTES
    testBase.logItemState('Estado ANTES');

    // Simular atualização (como a rota PATCH faria)
    console.log('=== ATUALIZANDO PARA CONCLUIDO SEM FOTO ===');
    await testBase.markItemAsCompleted(null);

    // Estado DEPOIS
    testBase.logItemState('Estado DEPOIS');
    console.log('');

    // Validações
    console.log('=== VALIDAÇÕES ===');
    const validation = testBase.validateItemState('CONCLUIDO', null);
    let todasValido = validation.isValid;

    if (validation.isValid) {
      console.log('  OK: Status é CONCLUIDO');
      console.log('  OK: Foto ID é null (concluído sem foto)');
      console.log('  OK: concluido_em foi definido');
    } else {
      validation.errors.forEach(error => {
        console.log(`  ERRO: ${error}`);
      });
    }

    // Verificar se item aparece na lista de concluídos
    const itensConcluidos = await testBase.getItemsByStatus('CONCLUIDO');
    const itensPendentes = await testBase.getItemsByStatus('PENDENTE');

    console.log('\n=== VERIFICAÇÃO DE LISTAS ===');
    console.log(`  Itens concluídos na vistoria: ${itensConcluidos.length}`);
    console.log(`  Itens pendentes na vistoria: ${itensPendentes.length}`);

    const itemEstaConcluido = itensConcluidos.some(i => i.id === item.id);
    const itemEstaPendente = itensPendentes.some(i => i.id === item.id);

    if (itemEstaConcluido && !itemEstaPendente) {
      console.log('  OK: Item aparece apenas na lista de concluídos');
    } else {
      console.log('  ERRO: Item não está na lista correta');
      console.log(`    Está em concluídos: ${itemEstaConcluido}`);
      console.log(`    Está em pendentes: ${itemEstaPendente}`);
      todasValido = false;
    }

    // Voltar para PENDENTE
    console.log('\n=== TESTANDO VOLTAR PARA PENDENTE ===');
    await testBase.markItemAsPending();

    const validationPending = testBase.validateItemState('PENDENTE', null);
    if (validationPending.isValid) {
      console.log('  OK: Item voltou para PENDENTE corretamente');
    } else {
      console.log('  ERRO: Item não voltou para PENDENTE corretamente');
      validationPending.errors.forEach(error => {
        console.log(`  ERRO: ${error}`);
      });
      todasValido = false;
    }

    console.log('\n=== RESULTADO FINAL ===');
    if (todasValido) {
      console.log('OK: Todos os testes passaram!');
      console.log('A funcionalidade de concluir item não obrigatório sem foto está 100% funcional.');
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

testConcluirSemFoto();

