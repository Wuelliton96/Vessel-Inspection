/**
 * Teste end-to-end completo para validar marcação de item como concluído
 */

const E2ETestBase = require('../tests/helpers/e2eTestBase');

async function testMarcarConcluidoEndToEnd() {
  try {
    console.log('=== TESTE END-TO-END: MARCAR ITEM COMO CONCLUIDO ===\n');

    const testBase = new E2ETestBase();

    // Buscar um vistoriador
    const vistoriador = await testBase.findVistoriador();
    console.log(`Vistoriador: ${vistoriador.nome} (ID: ${vistoriador.id})\n`);

    // Buscar item pendente de qualquer vistoria
    const item = await testBase.findPendingItem();

    if (!item) {
      console.log('Nenhum item PENDENTE encontrado para teste');
      process.exit(0);
    }

    testBase.logItemInfo();
    console.log('');

    // Simular requisição da rota
    console.log('=== SIMULANDO ROTA PATCH /api/checklists/vistoria/item/:id/status ===\n');

    testBase.logItemState('Estado ANTES');

    // Atualizar como a rota faria
    await testBase.markItemAsCompleted(null);

    testBase.logItemState('Estado DEPOIS');
    console.log('');

    // Validações
    console.log('=== VALIDAÇÕES ===');
    const validation = testBase.validateItemState('CONCLUIDO', null);
    let todasValido = validation.isValid;

    if (validation.isValid) {
      console.log('OK: Status atualizado para CONCLUIDO');
      console.log('OK: Foto ID é null');
      console.log('OK: concluido_em foi definido');
    } else {
      validation.errors.forEach(error => {
        console.log(`ERRO: ${error}`);
      });
    }

    // Testar voltar para PENDENTE
    console.log('\n=== TESTANDO VOLTAR PARA PENDENTE ===');
    await testBase.markItemAsPending();

    const validationPending = testBase.validateItemState('PENDENTE', null);
    if (validationPending.isValid) {
      console.log('OK: Item voltou para PENDENTE corretamente');
    } else {
      console.log('ERRO: Item não voltou para PENDENTE corretamente');
      validationPending.errors.forEach(error => {
        console.log(`ERRO: ${error}`);
      });
      todasValido = false;
    }

    console.log('\n=== RESULTADO FINAL ===');
    if (todasValido) {
      console.log('OK: Todos os testes passaram!');
      console.log('A funcionalidade de marcar como concluído sem foto está funcionando corretamente.');
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

testMarcarConcluidoEndToEnd();

