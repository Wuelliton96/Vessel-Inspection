/**
 * Teste end-to-end completo para validar marcação de item como concluído
 */

const E2ETestBase = require('../tests/helpers/e2eTestBase');

async function testMarcarConcluidoEndToEnd() {
  try {
    const testBase = new E2ETestBase();
    const todasValido = await testBase.runCompleteTest({
      testName: 'TESTE END-TO-END: MARCAR ITEM COMO CONCLUIDO',
      requireVistoriador: true
    });

    if (todasValido) {
      console.log('A funcionalidade de marcar como concluído sem foto está funcionando corretamente.');
    }

    process.exit(todasValido ? 0 : 1);
  } catch (error) {
    console.error('Erro no teste:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testMarcarConcluidoEndToEnd();

