/**
 * Teste completo para validar marcação de item como concluído
 * Simula a requisição HTTP completa
 */

const E2ETestBase = require('../tests/helpers/e2eTestBase');

async function testMarcarConcluidoCompleto() {
  try {
    const testBase = new E2ETestBase();
    let todasValido = await testBase.runCompleteTest({
      testName: 'TESTE COMPLETO: MARCAR ITEM COMO CONCLUIDO'
    });

    // Testar item obrigatório
    console.log('\n5. TESTANDO ITEM OBRIGATÓRIO:');
    const testBaseObrigatorio = new E2ETestBase();
    const itemObrigatorio = await testBaseObrigatorio.findPendingItem({ obrigatorio: true });

    if (itemObrigatorio) {
      console.log(`   Item obrigatório encontrado: ${testBaseObrigatorio.item.nome} (ID: ${testBaseObrigatorio.item.id})`);
      console.log('   Testando marcar como concluído sem foto...');
      
      const obrigatorioValid = await testBaseObrigatorio.runCompleteMarkAsCompletedTest();
      if (obrigatorioValid) {
        console.log('   OK: Item obrigatório pode ser concluído sem foto (permitido pelo sistema)');
      } else {
        todasValido = false;
      }
      await testBaseObrigatorio.markItemAsPending();
    } else {
      console.log('   Nenhum item obrigatório pendente encontrado para teste');
    }

    console.log('\n=== RESULTADO FINAL ===');
    if (todasValido) {
      console.log('OK: Todos os testes passaram!');
      console.log('A funcionalidade está 100% funcional.');
    } else {
      console.log('ERRO: Alguns testes falharam');
    }

    process.exit(todasValido ? 0 : 1);
  } catch (error) {
    console.error('Erro no teste:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testMarcarConcluidoCompleto();

